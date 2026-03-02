// src/lib/api.js
import axios from "axios";
import { authStore } from "../features/auth/store";

export const api = axios.create({
    baseURL: "/api",
    timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
      // If token expired/invalid -> force logout
      if (err?.response?.status === 401) {
        authStore.getState().clearSession?.();
        authStore.getState().clear?.(); // in case old name exists
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }
);