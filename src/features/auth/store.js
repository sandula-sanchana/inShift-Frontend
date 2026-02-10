import { create } from "zustand";

export const authStore = create((set, get) => ({
  token: localStorage.getItem("inshift_token") || "",
  user: (() => {
    const raw = localStorage.getItem("inshift_user");
    return raw ? JSON.parse(raw) : null;
  })(),
  setSession: (token, user) => {
    localStorage.setItem("inshift_token", token);
    localStorage.setItem("inshift_user", JSON.stringify(user));
    set({ token, user });
  },
  clear: () => {
    localStorage.removeItem("inshift_token");
    localStorage.removeItem("inshift_user");
    set({ token: "", user: null });
  },
  isAuthed: () => !!get().token && !!get().user,
}));