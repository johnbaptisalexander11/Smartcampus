import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "canteen_auth";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      setLoading(false);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setLoading(false);
      return;
    }

    if (!parsed?.token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setLoading(false);
      return;
    }

    setToken(parsed.token);
    if (parsed?.user) {
      setUser(parsed.user);
    }

    api
      .get("/auth/me", {
        headers: {
          Authorization: `Bearer ${parsed.token}`,
        },
      })
      .then((result) => {
        const nextUser = result.data.data.user;
        setUser(nextUser);
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ token: parsed.token, user: nextUser })
        );
      })
      .catch(() => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const saveSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    api.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: nextToken, user: nextUser })
    );
  };

  const register = async (payload) => {
    const result = await api.post("/auth/register", payload);
    // OTP required — do not create a session until phone is verified.
    if (result.data?.data?.requiresOtp) {
      return result;
    }
    if (result.data?.data?.token && result.data?.data?.user) {
      saveSession(result.data.data.token, result.data.data.user);
    }
    return result;
  };

  const verifyOtp = async (payload) => {
    const result = await api.post("/auth/verify-otp", payload);
    saveSession(result.data.data.token, result.data.data.user);
    return result;
  };

  const resendOtp = async (payload) => {
    const result = await api.post("/auth/resend-otp", payload);
    return result;
  };

  const login = async (payload) => {
    const result = await api.post("/auth/login", payload);
    saveSession(result.data.data.token, result.data.data.user);
    return result;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const refreshUser = async () => {
    if (!token) return null;
    const result = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setUser(result.data.data.user);
    return result.data.data.user;
  };

  const updateProfile = async (payload) => {
    if (!token) throw new Error("Not authenticated");
    const result = await api.put("/auth/profile", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const nextUser = result.data.data.user;
    setUser(nextUser);
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token, user: nextUser })
    );
    return result;
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      register,
      verifyOtp,
      resendOtp,
      login,
      logout,
      refreshUser,
      updateProfile,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
