const axios = require("axios");

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const buildSystemPrompt = ({ intent, menu, walletBalance, foodPreference, timeOfDay, orderHistory }) => {
  return `You are a university food assistant.
Return only one format based on user intent (${intent}):
- order => ORDER_ITEMS
- recommendations => RECOMMENDATIONS
- combo => COMBO
- personalized => PERSONALIZED_SUGGESTIONS

Rules:
- Use only menu items provided.
- Never include unavailable items.
- Keep suggestions within budget (walletBalance and asked budget).
- Keep output short and practical.
- If quantity is missing for order, assume 1.

Available menu:
${JSON.stringify(menu)}

Context:
walletBalance: ${walletBalance}
foodPreference: ${foodPreference || "any"}
timeOfDay: ${timeOfDay || "any"}
orderHistory: ${JSON.stringify(orderHistory || [])}

Output templates:
ORDER_ITEMS:
- item: <menu_item_name>
  qty: <number>
TOTAL_ESTIMATE: Rs. <amount>

RECOMMENDATIONS:
- <item_name> - Rs. <price> (<short reason>)
TOTAL_ESTIMATE: Rs. <amount>

COMBO:
- item: <menu_item_name>
TOTAL_ESTIMATE: Rs. <amount>
REASON: <short reason>

PERSONALIZED_SUGGESTIONS:
- <item_name> - Rs. <price> (<short reason>)
TOTAL_ESTIMATE: Rs. <amount>`;
};

const extractTextFromResponse = (payload) => {
  if (!payload) return "";
  if (typeof payload.output_text === "string") return payload.output_text;
  if (Array.isArray(payload.output)) {
    const parts = [];
    payload.output.forEach((item) => {
      if (Array.isArray(item?.content)) {
        item.content.forEach((c) => {
          if (c?.type === "output_text" && c?.text) parts.push(c.text);
        });
      }
    });
    return parts.join("\n").trim();
  }
  return "";
};

const getAssistantCompletion = async ({ userMessage, context }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const input = [
    {
      role: "system",
      content: [{ type: "input_text", text: buildSystemPrompt(context) }],
    },
    {
      role: "user",
      content: [{ type: "input_text", text: userMessage }],
    },
  ];

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: OPENAI_MODEL,
        input,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    return extractTextFromResponse(response.data);
  } catch {
    return null;
  }
};

module.exports = {
  getAssistantCompletion,
};

