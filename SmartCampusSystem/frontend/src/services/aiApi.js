import api from "./api";

export const askFoodAssistant = async (payload) => {
  const response = await api.post("/ai/assistant", payload);
  return response.data?.data || {};
};

