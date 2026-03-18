// src/features/auth/store.js
import { create } from "zustand";

const TOKEN_KEY = "inshift_token";
const USER_KEY = "inshift_user";

export const authStore = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: (() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  })(),

  isAuthed: () => Boolean(get().token),

  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
}));