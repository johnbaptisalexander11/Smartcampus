import api from "../../../services/api";

export const fetchAdminDashboardStats = async () => {
  const response = await api.get("/admin/dashboard-stats");
  return response.data.data.stats;
};

export const fetchUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data.data.users;
};

export const updateUserStatus = async (userId, isActive) => {
  const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
  return response.data.data.user;
};

export const fetchAdminOrders = async () => {
  const response = await api.get("/admin/orders");
  return response.data.data.orders;
};

export const fetchCanteenMenu = async () => {
  const response = await api.get("/admin/canteen/menu");
  return response.data.data.items;
};

export const createCanteenMenuItem = async (payload) => {
  const response = await api.post("/admin/canteen/menu", payload);
  return response.data.data.item;
};

export const updateCanteenMenuItem = async (itemId, payload) => {
  const response = await api.patch(`/admin/canteen/menu/${itemId}`, payload);
  return response.data.data.item;
};

export const deleteCanteenMenuItem = async (itemId) => {
  await api.delete(`/admin/canteen/menu/${itemId}`);
};

export const fetchWalletReports = async () => {
  const response = await api.get("/admin/wallet-reports");
  return response.data.data.totals;
};

export const fetchAdminComplaints = async () => {
  const response = await api.get("/admin/complaints");
  return response.data.data.complaints;
};

export const fetchFoodSharingPostsForModeration = async () => {
  const response = await api.get("/admin/food-sharing");
  return response.data.data.posts;
};

export const moderateFoodSharingPost = async (postId, status, moderationNote = "") => {
  const response = await api.patch(`/admin/food-sharing/${postId}/moderate`, { status, moderationNote });
  return response.data.data.post;
};

export const fetchReportedFoodPosts = async () => {
  const response = await api.get("/admin/food-sharing/reported");
  return response.data.data.posts;
};

export const removeFoodPostAdmin = async (postId, moderationNote = "") => {
  const response = await api.delete(`/admin/food-sharing/${postId}`, { data: { moderationNote } });
  return response.data.data.post;
};

export const fetchGroupStudyFeedbackForAdmin = async () => {
  const response = await api.get("/admin/group-study-feedback");
  return response.data.data.groups;
};

export const fetchAdminUserActivity = async (params = {}) => {
  const response = await api.get("/admin/users/activity", { params });
  return response.data.data.users;
};

export const fetchUserActivityDetails = async (userId) => {
  const response = await api.get(`/admin/users/${userId}/activity`);
  return response.data.data;
};

export const updateUserAccountStatus = async (userId, payload) => {
  const response = await api.patch(`/admin/users/${userId}/account-status`, payload);
  return response.data.data.user;
};
