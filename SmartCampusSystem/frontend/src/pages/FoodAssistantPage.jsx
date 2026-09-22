import { useEffect, useMemo, useState } from "react";
import FoodChatBox from "../components/FoodChatBox";
import RecommendationCards from "../components/RecommendationCards";
import ComboCard from "../components/ComboCard";
import PersonalizedSuggestions from "../components/PersonalizedSuggestions";
import MenuList from "../components/MenuList";
import CartSummary from "../components/CartSummary";
import { askFoodAssistant } from "../services/aiApi";
import { fetchMenu, addItemToCart, fetchOrderHistory } from "../modules/food-ordering/services/foodOrderingService";
import { fetchWallet } from "../modules/wallet/services/walletService";

const FoodAssistantPage = () => {
  const [menu, setMenu] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [orderHistory, setOrderHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState("");

  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "morning";
    if (hour < 16) return "lunch";
    if (hour < 20) return "evening";
    return "dinner";
  }, []);

  const buildMenuPayload = (items) =>
    items.map((item) => ({
      id: item._id,
      name: item.name,
      price: item.price,
      category: item.category?.name || "snack",
      type: /(chicken|fish|beef|mutton|egg|prawn|sausage|meat)/i.test(item.name) ? "non-veg" : "veg",
      available: Boolean(item.isAvailable),
    }));

  const buildHistoryPayload = (orders) => {
    const flattened = [];
    (orders || []).forEach((order) => {
      (order.items || []).forEach((item) => {
        flattened.push({ itemName: item.name, qty: item.quantity || 1 });
      });
    });
    return flattened;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [menuData, walletData, historyData] = await Promise.all([
          fetchMenu({}),
          fetchWallet(),
          fetchOrderHistory(),
        ]);
        setMenu(menuData || []);
        setWalletBalance(Number(walletData?.balance || 0));
        setOrderHistory(buildHistoryPayload(historyData || []));
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load assistant context");
      }
    };
    load();
  }, []);

  const handleSend = async (text) => {
    setLoading(true);
    setError("");
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text }]);

    try {
      const payload = {
        message: text,
        walletBalance,
        foodPreference: "any",
        timeOfDay,
        menu: buildMenuPayload(menu),
        orderHistory,
      };
      const response = await askFoodAssistant(payload);
      const parsed = response?.response || null;
      setAssistantResponse(parsed);
      const summaryText =
        parsed?.type === "order"
          ? `Prepared ${parsed.items?.length || 0} order item(s).`
          : `Generated ${parsed?.type || "assistant"} response.`;
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: summaryText }]);
    } catch (apiError) {
      const message = apiError.response?.data?.message || "Assistant request failed";
      setError(message);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!assistantResponse || assistantResponse.type !== "order") return;
    setAddingToCart(true);
    setError("");
    try {
      const menuMap = new Map(menu.map((item) => [item.name.toLowerCase(), item]));
      for (const item of assistantResponse.items || []) {
        const match = menuMap.get(String(item.item || "").toLowerCase());
        if (!match?._id) continue;
        await addItemToCart({ foodItemId: match._id, quantity: item.qty || 1 });
      }
      setMessages((prev) => [...prev, { id: Date.now() + 2, role: "assistant", text: "Items added to cart successfully." }]);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Could not add items to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="w-full px-4 py-5 md:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Food Assistant</h1>
        <p className="text-sm text-slate-500">AI-powered suggestions, combo building, and chat-based ordering</p>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <FoodChatBox messages={messages} onSend={handleSend} loading={loading} />

          {assistantResponse?.type === "recommendations" ? (
            <RecommendationCards
              items={assistantResponse.items || []}
              totalEstimate={assistantResponse.totalEstimate || 0}
            />
          ) : null}

          {assistantResponse?.type === "combo" ? <ComboCard combo={assistantResponse} /> : null}

          {assistantResponse?.type === "personalized" ? (
            <PersonalizedSuggestions
              items={assistantResponse.items || []}
              totalEstimate={assistantResponse.totalEstimate || 0}
            />
          ) : null}

          {assistantResponse?.type === "menu_list" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800">Available Menu Items</h3>
              <p className="mt-1 text-xs text-slate-500">Total items: {assistantResponse.totalItems || 0}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(assistantResponse.items || []).map((item) => (
                  <div key={item.item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-sm font-semibold text-slate-800">{item.item}</p>
                    <p className="text-xs text-slate-600">Rs. {item.price} · {item.category} · {item.type}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {assistantResponse?.type === "order" ? (
            <CartSummary order={assistantResponse} onAddToCart={handleAddToCart} addingToCart={addingToCart} />
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Wallet Balance</p>
            <p className="text-xl font-bold text-emerald-700">Rs. {walletBalance}</p>
            <p className="mt-1 text-xs text-slate-500">Time context: {timeOfDay}</p>
          </div>
          <MenuList menu={buildMenuPayload(menu)} />
        </div>
      </div>
    </div>
  );
};

export default FoodAssistantPage;
