import axios from "axios";
import { ENV } from "./env";
import { authStore } from "../features/auth/store";

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
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
    // Surface a friendly error message in UI
    return Promise.reject(err);
  }
);