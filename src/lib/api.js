import axios from "axios";
import { authStore } from "../features/auth/store";

export const api = axios.create({
    baseURL: "/api",
    timeout: 15000,
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
    refreshSubscribers.push(callback);
}

function onRefreshed(newAccessToken) {
    refreshSubscribers.forEach((callback) => callback(newAccessToken));
    refreshSubscribers = [];
}

async function requestNewAccessToken() {
    const { refreshToken, user, setSession, updateAccessToken, clearSession, clear } = authStore.getState();

    if (!refreshToken) {
        throw new Error("No refresh token available");
    }

    try {
        const res = await axios.post("/api/v1/auth/refresh", {
            refreshToken,
        });

        const data = res?.data?.data;

        const newAccessToken = data?.accessToken ?? data?.access_token;
        const newRefreshToken = data?.refreshToken ?? data?.refresh_token ?? refreshToken;
        const role = data?.role ?? user?.role;
        const passwordMustChange = !!data?.passwordMustChange;

        if (!newAccessToken) {
            throw new Error("Access token missing in refresh response");
        }

        if (newRefreshToken !== refreshToken) {
            setSession(newAccessToken, newRefreshToken, {
                ...(user || {}),
                role,
                passwordMustChange,
            });
        } else {
            updateAccessToken(newAccessToken);
        }

        return newAccessToken;
    } catch (err) {
        clearSession?.();
        clear?.();
        throw err;
    }
}

api.interceptors.request.use((config) => {
    const accessToken = authStore.getState().accessToken;
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const originalRequest = err?.config;
        const status = err?.response?.status;

        if (!originalRequest) {
            return Promise.reject(err);
        }

        // don't refresh login or refresh calls themselves
        const url = originalRequest?.url || "";
        const isAuthEndpoint =
            url.includes("/v1/auth/login") ||
            url.includes("/v1/auth/refresh");

        if (status !== 401 || isAuthEndpoint) {
            return Promise.reject(err);
        }

        if (originalRequest._retry) {
            authStore.getState().clearSession?.();
            authStore.getState().clear?.();
            window.location.href = "/login";
            return Promise.reject(err);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                subscribeTokenRefresh((newToken) => {
                    try {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(api(originalRequest));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const newAccessToken = await requestNewAccessToken();
            isRefreshing = false;
            onRefreshed(newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshErr) {
            isRefreshing = false;
            refreshSubscribers = [];

            authStore.getState().clearSession?.();
            authStore.getState().clear?.();
            window.location.href = "/login";

            return Promise.reject(refreshErr);
        }
    }
);