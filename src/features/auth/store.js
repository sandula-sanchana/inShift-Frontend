import { create } from "zustand";

const ACCESS_TOKEN_KEY = "inshift_access_token";
const REFRESH_TOKEN_KEY = "inshift_refresh_token";
const USER_KEY = "inshift_user";

export const authStore = create((set, get) => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || null,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || null,
  user: (() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  })(),

  isAuthed: () => Boolean(get().accessToken),

  setSession: (accessToken, refreshToken, user) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    set({
      accessToken,
      refreshToken,
      user,
    });
  },

  updateAccessToken: (newAccessToken) => {
    const currentRefreshToken = get().refreshToken;

    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

    set({
      accessToken: newAccessToken,
      refreshToken: currentRefreshToken,
    });
  },

  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  },

  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  },
}));