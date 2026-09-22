import api from "../../../services/api";

export const fetchVendorDashboardStats = async () => {
  const response = await api.get("/vendor/dashboard-stats");
  return response.data.data.stats;
};

export const fetchVendorMenu = async () => {
  const response = await api.get("/vendor/menu");
  return response.data.data.items;
};

export const createVendorMenuItem = async (payload) => {
  const response = await api.post("/vendor/menu", payload);
  return response.data.data.item;
};

export const updateVendorMenuItem = async (itemId, payload) => {
  const response = await api.put(`/vendor/menu/${itemId}`, payload);
  return response.data.data.item;
};

export const deleteVendorMenuItem = async (itemId) => {
  const response = await api.delete(`/vendor/menu/${itemId}`);
  return response.data;
};

export const fetchVendorOrders = async () => {
  const response = await api.get("/vendor/orders");
  return response.data.data.orders;
};

export const updateVendorOrderStatus = async (orderId, payload) => {
  const response = await api.patch(`/vendor/orders/${orderId}/status`, payload);
  return response.data.data.order;
};

export const fetchVendorRevenueSummary = async () => {
  const response = await api.get("/vendor/revenue-summary");
  return response.data.data.monthly;
};
