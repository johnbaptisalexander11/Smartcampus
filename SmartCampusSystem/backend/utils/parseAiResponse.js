const extractTotalEstimate = (text) => {
  const match = text.match(/TOTAL_ESTIMATE:\s*Rs\.?\s*([0-9]+(?:\.[0-9]+)?)/i);
  return match ? Number(match[1]) : null;
};

const extractReason = (text) => {
  const match = text.match(/REASON:\s*(.+)/i);
  return match ? match[1].trim() : "";
};

const detectIntent = (message = "") => {
  const text = String(message).toLowerCase();

  if (
    /(list.*menu|show.*menu|show.*available|available items|menu kaatu|enna items iruku|menu items|menu list)/i.test(
      text
    )
  ) {
    return "menu_list";
  }

  if (/(combo|full meal|meal set|set meal)/i.test(text)) return "combo";
  if (/(previous|history|usual|frequent|personalized|based on my)/i.test(text)) return "personalized";
  if (/(what should i eat|enna sapida|idea illa|suggest pannu|budget ku|suggestion)/i.test(text)) return "recommendations";
  if (/(order|add|buy|checkout|cart|need|give|1 |2 |3 |4 |5 )/i.test(text)) return "order";
  return "recommendations";
};

const parseOrderItems = (raw) => {
  const items = [];
  const regex = /-\s*item:\s*(.+?)\s*\n\s*qty:\s*([0-9]+)/gi;
  let match = regex.exec(raw);
  while (match) {
    items.push({ item: match[1].trim(), qty: Number(match[2]) });
    match = regex.exec(raw);
  }
  return items;
};

const parseRecommendationItems = (raw) => {
  const items = [];
  const regex = /-\s*(.+?)\s*-\s*Rs\.?\s*([0-9]+(?:\.[0-9]+)?)\s*\((.+?)\)/gi;
  let match = regex.exec(raw);
  while (match) {
    items.push({
      item: match[1].trim(),
      price: Number(match[2]),
      reason: match[3].trim(),
    });
    match = regex.exec(raw);
  }
  return items;
};

const parseComboItems = (raw) => {
  const items = [];
  const regex = /-\s*item:\s*(.+)/gi;
  let match = regex.exec(raw);
  while (match) {
    items.push({ item: match[1].trim() });
    match = regex.exec(raw);
  }
  return items;
};

const parseAiResponse = (raw = "") => {
  const text = String(raw || "").replace(/\r/g, "").trim();
  if (!text) return null;

  if (/^ORDER_ITEMS:/im.test(text)) {
    return {
      type: "order",
      items: parseOrderItems(text),
      totalEstimate: extractTotalEstimate(text),
      raw,
    };
  }

  if (/^RECOMMENDATIONS:/im.test(text)) {
    return {
      type: "recommendations",
      items: parseRecommendationItems(text),
      totalEstimate: extractTotalEstimate(text),
      raw,
    };
  }

  if (/^COMBO:/im.test(text)) {
    return {
      type: "combo",
      items: parseComboItems(text),
      totalEstimate: extractTotalEstimate(text),
      reason: extractReason(text),
      raw,
    };
  }

  if (/^PERSONALIZED_SUGGESTIONS:/im.test(text)) {
    return {
      type: "personalized",
      items: parseRecommendationItems(text),
      totalEstimate: extractTotalEstimate(text),
      raw,
    };
  }

  return null;
};

module.exports = {
  parseAiResponse,
  detectIntent,
};
