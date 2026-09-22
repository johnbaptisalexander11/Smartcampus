import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
});

export const registerUser = async (payload) => {
  const response = await authApi.post("/register", payload);
  return response.data;
};

export const verifyPhoneOtp = async (payload) => {
  const response = await authApi.post("/verify-otp", payload);
  return response.data;
};

export const resendPhoneOtp = async (payload) => {
  const response = await authApi.post("/resend-otp", payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await authApi.post("/login", payload);
  return response.data;
};

export const getMe = async (token) => {
  const response = await authApi.get("/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateMyProfile = async (payload, token) => {
  const response = await authApi.put("/profile", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await authApi.post("/forgot-password", { email });
  return response.data;
};

export const verifyPasswordResetOtp = async (payload) => {
  const response = await authApi.post("/forgot-password/verify-otp", payload);
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await authApi.post("/reset-password", { token, newPassword });
  return response.data;
};
