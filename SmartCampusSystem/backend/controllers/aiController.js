const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const { sendError, sendSuccess } = require("../utils/apiResponse");
const { normalizeTamilInput } = require("../utils/normalizeTamilInput");
const { parseAiResponse, detectIntent } = require("../utils/parseAiResponse");
const { getAssistantCompletion } = require("../services/openaiService");

const inferTypeFromName = (name = "") => {
  return /(chicken|fish|beef|mutton|egg|prawn|sausage|meat)/i.test(name) ? "non-veg" : "veg";
};

const sanitizeMenuItem = (item) => {
  if (!item || !item.name) return null;
  const price = Number(item.price);
  if (!Number.isFinite(price) || price < 0) return null;
  return {
    id: item.id || item._id || null,
    name: String(item.name).trim(),
    price,
    category: String(item.category?.name || item.category || "snack").toLowerCase(),
    type: (item.type || inferTypeFromName(item.name)).toLowerCase() === "non-veg" ? "non-veg" : "veg",
    available: item.available !== undefined ? Boolean(item.available) : Boolean(item.isAvailable ?? true),
  };
};

const parseBudgetFromMessage = (message) => {
  const match = String(message).match(/(?:rs|lkr|budget|under|for)\s*\.?\s*([0-9]+)/i);
  return match ? Number(match[1]) : null;
};

const getWalletBalance = async (userId, providedBalance) => {
  if (Number.isFinite(Number(providedBalance))) return Number(providedBalance);
  const wallet = await Wallet.findOne({ user: userId });
  return wallet?.balance || 0;
};

const getHistory = async (userId, providedHistory) => {
  if (Array.isArray(providedHistory) && providedHistory.length) return providedHistory;

  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(20).select("items");
  const history = [];
  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      history.push({ itemName: item.name, qty: item.quantity || 1 });
    });
  });
  return history;
};

const buildMenu = async (providedMenu) => {
  if (Array.isArray(providedMenu) && providedMenu.length) {
    return providedMenu.map(sanitizeMenuItem).filter(Boolean);
  }

  const items = await FoodItem.find({ isAvailable: true }).populate("category", "name");
  return items.map(sanitizeMenuItem).filter(Boolean);
};

const getItemMatch = (name, menu) => {
  const target = String(name || "").trim().toLowerCase();
  if (!target) return null;
  let match = menu.find((item) => item.name.toLowerCase() === target);
  if (match) return match;
  match = menu.find((item) => item.name.toLowerCase().includes(target) || target.includes(item.name.toLowerCase()));
  return match || null;
};

const pickClosestAlternative = (requested, menu, budgetLeft = Number.MAX_SAFE_INTEGER) => {
  const keyword = String(requested || "").toLowerCase().trim();
  const affordable = menu.filter((m) => m.available && m.price <= budgetLeft);
  if (!affordable.length) return null;
  const byName = affordable.find((m) => m.name.toLowerCase().includes(keyword.split(" ")[0]));
  if (byName) return byName;
  return affordable.sort((a, b) => a.price - b.price)[0];
};

const extractOrderItemsFromText = (message, menu) => {
  const normalized = normalizeTamilInput(message);
  const items = [];
  const byName = [...menu].sort((a, b) => b.name.length - a.name.length);

  byName.forEach((menuItem) => {
    const escaped = menuItem.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|\\b)(\\d+)?\\s*${escaped}(?:\\b|$)`, "gi");
    let match = regex.exec(normalized);
    while (match) {
      const qty = Number(match[1] || 1);
      items.push({ item: menuItem.name, qty: qty > 0 ? qty : 1 });
      match = regex.exec(normalized);
    }
  });

  const merged = new Map();
  items.forEach((item) => {
    const key = item.item.toLowerCase();
    merged.set(key, (merged.get(key) || 0) + item.qty);
  });

  return Array.from(merged.entries()).map(([key, qty]) => {
    const found = menu.find((m) => m.name.toLowerCase() === key);
    return { item: found?.name || key, qty };
  });
};

const validateOrderOutput = (rawOutput, menu, walletBalance) => {
  const warnings = [];
  const items = [];

  (rawOutput.items || []).forEach((entry) => {
    const qty = Math.max(1, Math.floor(Number(entry.qty || 1)));
    const matched = getItemMatch(entry.item, menu);
    if (!matched) {
      warnings.push(`Item not found: ${entry.item}`);
      return;
    }
    if (!matched.available) {
      const alternative = pickClosestAlternative(entry.item, menu, walletBalance);
      warnings.push(
        `${matched.name} is unavailable${alternative ? `. Try ${alternative.name}` : ""}`
      );
      return;
    }
    const subtotal = matched.price * qty;
    items.push({
      item: matched.name,
      qty,
      price: matched.price,
      subtotal,
      menuItemId: matched.id,
    });
  });

  const totalEstimate = items.reduce((sum, item) => sum + item.subtotal, 0);
  if (walletBalance > 0 && totalEstimate > walletBalance) {
    warnings.push(`Total exceeds wallet balance by Rs. ${totalEstimate - walletBalance}`);
  }

  return {
    type: "order",
    items,
    totalEstimate,
    warnings,
    canAddToCart: items.length > 0 && totalEstimate <= walletBalance,
  };
};

const validateSuggestionOutput = (rawOutput, menu, walletBalance, type) => {
  const warnings = [];
  const validItems = [];
  let runningTotal = 0;

  (rawOutput.items || []).forEach((entry) => {
    const matched = getItemMatch(entry.item, menu);
    if (!matched || !matched.available) return;
    if (runningTotal + matched.price > walletBalance) return;
    runningTotal += matched.price;
    validItems.push({
      item: matched.name,
      price: matched.price,
      reason: entry.reason || "",
    });
  });

  if (!validItems.length) {
    warnings.push("No matching suggestions found within budget.");
  }

  return {
    type,
    items: validItems,
    totalEstimate: validItems.reduce((sum, item) => sum + item.price, 0),
    reason: rawOutput.reason || "",
    warnings,
  };
};

const fallbackRecommendations = ({ menu, walletBalance, foodPreference, timeOfDay }) => {
  const mealTime = String(timeOfDay || "").toLowerCase();
  const preferred = (foodPreference || "").toLowerCase();
  const budget = walletBalance > 0 ? walletBalance : Number.MAX_SAFE_INTEGER;

  let candidates = menu.filter((item) => item.available && item.price <= budget);
  if (preferred === "veg" || preferred === "non-veg") {
    candidates = candidates.filter((item) => item.type === preferred);
  }

  if (mealTime.includes("morning")) {
    candidates.sort((a, b) => (a.category.includes("drink") ? -1 : 1) - (b.category.includes("drink") ? -1 : 1));
  } else if (mealTime.includes("lunch") || mealTime.includes("dinner")) {
    candidates.sort((a, b) => (a.category.includes("meal") ? -1 : 1) - (b.category.includes("meal") ? -1 : 1));
  } else {
    candidates.sort((a, b) => a.price - b.price);
  }

  const picks = candidates.slice(0, 3).map((item) => ({
    item: item.name,
    price: item.price,
    reason: "fits your budget",
  }));

  return {
    type: "recommendations",
    items: picks,
    totalEstimate: picks.reduce((sum, item) => sum + item.price, 0),
  };
};

const fallbackCombo = ({ menu, walletBalance, message }) => {
  const target = parseBudgetFromMessage(message) || walletBalance;
  const budget = target > 0 ? target : Number.MAX_SAFE_INTEGER;
  const mains = menu.filter((i) => i.available && /meal|rice|kottu|noodle/.test(i.category) && i.price <= budget);
  const sides = menu.filter((i) => i.available && /snack|side|bun|roll/.test(i.category) && i.price <= budget);
  const drinks = menu.filter((i) => i.available && /drink|beverage|tea|coffee|juice/.test(i.category) && i.price <= budget);

  const main = mains.sort((a, b) => a.price - b.price)[0];
  const side = sides.sort((a, b) => a.price - b.price)[0];
  const drink = drinks.sort((a, b) => a.price - b.price)[0];

  const items = [main, side, drink].filter(Boolean);
  let total = items.reduce((sum, item) => sum + item.price, 0);
  while (total > budget && items.length) {
    items.pop();
    total = items.reduce((sum, item) => sum + item.price, 0);
  }

  return {
    type: "combo",
    items: items.map((item) => ({ item: item.name, price: item.price })),
    totalEstimate: total,
    reason: "balanced and affordable combo",
  };
};

const fallbackPersonalized = ({ menu, history, walletBalance, foodPreference, timeOfDay }) => {
  const countMap = new Map();
  history.forEach((entry) => {
    const key = String(entry.itemName || "").toLowerCase();
    if (!key) return;
    countMap.set(key, (countMap.get(key) || 0) + Number(entry.qty || 1));
  });

  const sortedHistoryNames = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const items = [];
  let total = 0;
  sortedHistoryNames.forEach((name) => {
    const found = getItemMatch(name, menu);
    if (!found || !found.available) return;
    if (total + found.price > walletBalance) return;
    total += found.price;
    items.push({ item: found.name, price: found.price, reason: "you order this often" });
  });

  if (!items.length) return fallbackRecommendations({ menu, walletBalance, foodPreference, timeOfDay });

  return {
    type: "personalized",
    items: items.slice(0, 3),
    totalEstimate: items.slice(0, 3).reduce((sum, item) => sum + item.price, 0),
  };
};

const buildMenuListResponse = ({ menu }) => {
  const availableItems = (menu || [])
    .filter((item) => item.available)
    .map((item) => ({
      item: item.name,
      price: item.price,
      category: item.category,
      type: item.type,
    }))
    .sort((a, b) => a.price - b.price);

  return {
    type: "menu_list",
    items: availableItems,
    totalItems: availableItems.length,
  };
};

const fallbackOutputByIntent = ({ intent, message, menu, walletBalance, foodPreference, timeOfDay, history }) => {
  if (intent === "menu_list") {
    return buildMenuListResponse({ menu });
  }
  if (intent === "order") {
    const extracted = extractOrderItemsFromText(message, menu);
    return {
      type: "order",
      items: extracted.length ? extracted : [],
      totalEstimate: null,
    };
  }
  if (intent === "combo") return fallbackCombo({ menu, walletBalance, message });
  if (intent === "personalized") {
    return fallbackPersonalized({ menu, history, walletBalance, foodPreference, timeOfDay });
  }
  return fallbackRecommendations({ menu, walletBalance, foodPreference, timeOfDay });
};

const assistantHandler = async (req, res, next) => {
  try {
    const {
      message,
      walletBalance: walletFromBody,
      foodPreference = "any",
      timeOfDay = "any",
      menu: providedMenu,
      orderHistory: providedHistory,
    } = req.body || {};

    if (!String(message || "").trim()) {
      return sendError(res, "message is required", 400);
    }

    const normalizedMessage = normalizeTamilInput(message);
    const intent = detectIntent(normalizedMessage);
    const menu = await buildMenu(providedMenu);
    if (!menu.length) return sendError(res, "No menu items available for assistant", 400);

    const walletBalance = await getWalletBalance(req.user?._id, walletFromBody);
    const history = await getHistory(req.user?._id, providedHistory);
    const askedBudget = parseBudgetFromMessage(normalizedMessage);
    const effectiveBudget = askedBudget && askedBudget > 0 ? Math.min(walletBalance || askedBudget, askedBudget) : walletBalance;

    if (intent === "menu_list") {
      return sendSuccess(
        res,
        "Available menu items fetched",
        {
          response: buildMenuListResponse({ menu }),
          meta: {
            intent,
            source: "backend",
            normalizedMessage,
          },
        },
        200
      );
    }

    const aiRaw = await getAssistantCompletion({
      userMessage: normalizedMessage,
      context: {
        intent,
        menu,
        walletBalance: effectiveBudget || walletBalance,
        foodPreference,
        timeOfDay,
        orderHistory: history,
      },
    });

    const parsed = aiRaw ? parseAiResponse(aiRaw) : null;
    const fallback = fallbackOutputByIntent({
      intent,
      message: normalizedMessage,
      menu,
      walletBalance: effectiveBudget || walletBalance,
      foodPreference,
      timeOfDay,
      history,
    });
    const candidate = parsed || fallback;

    let responseData;
    if (candidate.type === "menu_list") {
      responseData = buildMenuListResponse({ menu });
    } else if (candidate.type === "order") {
      responseData = validateOrderOutput(candidate, menu, effectiveBudget || walletBalance);
    } else if (candidate.type === "combo") {
      responseData = validateSuggestionOutput(candidate, menu, effectiveBudget || walletBalance, "combo");
      responseData.reason = candidate.reason || "budget-friendly combo";
    } else if (candidate.type === "personalized") {
      responseData = validateSuggestionOutput(candidate, menu, effectiveBudget || walletBalance, "personalized");
    } else {
      responseData = validateSuggestionOutput(candidate, menu, effectiveBudget || walletBalance, "recommendations");
    }

    return sendSuccess(
      res,
      "AI assistant response generated",
      {
        response: responseData,
        meta: {
          intent,
          source: parsed ? "openai" : "fallback",
          normalizedMessage,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assistantHandler,
};
