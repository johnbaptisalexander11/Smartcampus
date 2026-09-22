import api from "../../../services/api";

const BASE = "/food-ordering";

export const fetchCategories = async () => {
  const response = await api.get(`${BASE}/categories`);
  return response.data.data.categories;
};

export const fetchMenu = async (params) => {
  const response = await api.get(`${BASE}/menu`, { params });
  return response.data.data.items;
};

export const fetchFoodItem = async (itemId) => {
  const response = await api.get(`${BASE}/menu/${itemId}`);
  return response.data.data.item;
};

export const fetchCart = async () => {
  const response = await api.get(`${BASE}/cart`);
  return response.data.data;
};

export const addItemToCart = async ({ foodItemId, quantity }) => {
  const response = await api.post(`${BASE}/cart/items`, { foodItemId, quantity });
  return response.data.data;
};

export const updateItemInCart = async ({ itemId, quantity }) => {
  const response = await api.put(`${BASE}/cart/items/${itemId}`, { quantity });
  return response.data.data;
};

export const removeItemFromCart = async (itemId) => {
  const response = await api.delete(`${BASE}/cart/items/${itemId}`);
  return response.data.data;
};

export const clearMyCart = async () => {
  const response = await api.delete(`${BASE}/cart`);
  return response.data.data;
};

export const fetchCheckout = async () => {
  const response = await api.get(`${BASE}/checkout`);
  return response.data.data;
};

export const createOrder = async (paymentMethod = "cash", smsPhone = "") => {
  const body = { paymentMethod };
  if (smsPhone) body.smsPhone = smsPhone;
  const response = await api.post(`${BASE}/orders`, body);
  return response.data.data;
};

export const fetchOrderHistory = async () => {
  const response = await api.get(`${BASE}/orders`);
  return response.data.data.orders;
};

export const fetchOrderById = async (orderId) => {
  const response = await api.get(`${BASE}/orders/${orderId}`);
  return response.data.data.order;
};

export const updateOrderStatus = async (orderId, { status, note = "" }) => {
  const response = await api.patch(`${BASE}/orders/${orderId}/status`, { status, note });
  return response.data.data.order;
};

export const fetchReviews = async (itemId) => {
  const response = await api.get(`${BASE}/menu/${itemId}/reviews`);
  return response.data.data.reviews;
};

export const submitReview = async (itemId, payload) => {
  const response = await api.post(`${BASE}/menu/${itemId}/reviews`, payload);
  return response.data.data.review;
};

export const verifyOrderCode = async (code) => {
  const response = await api.get(`${BASE}/orders/verify/${code}`);
  return response.data.data.order;
};

export const markOrderDelivered = async (code) => {
  const response = await api.patch(`${BASE}/orders/deliver/${code}`);
  return response.data.data.order;
};
