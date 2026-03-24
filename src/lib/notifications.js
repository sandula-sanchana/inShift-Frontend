import { getToken, onMessage, isSupported } from "firebase/messaging";
import { messaging, vapidKey } from "./firebase";
import { api } from "./api.js";

const DEVICE_TOKEN_BASE = "/v1/emp/device-tokens";
export const LOCAL_FCM_TOKEN_KEY = "inshift_fcm_token";

function canUseBrowserApis() {
    return typeof window !== "undefined" && typeof navigator !== "undefined";
}

function canUseNotificationsApi() {
    return canUseBrowserApis() && "Notification" in window;
}

function canUseServiceWorkers() {
    return canUseBrowserApis() && "serviceWorker" in navigator;
}

async function getMessagingSupport() {
    return await isSupported().catch(() => false);
}

async function getActiveServiceWorkerRegistration() {
    if (!canUseServiceWorkers()) return null;

    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    return await navigator.serviceWorker.ready;
}

export function getDeviceType() {
    if (!canUseBrowserApis()) return "COMPANY_PC";

    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

    return isMobile ? "MOBILE" : "COMPANY_PC";
}

export function getDeviceName() {
    if (!canUseBrowserApis()) return "Web Browser";

    const ua = navigator.userAgent || "";

    if (/Android/i.test(ua)) return "Android Browser";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone / iPad Browser";
    if (/Windows/i.test(ua)) return "Windows Browser";
    if (/Macintosh|Mac OS X/i.test(ua)) return "Mac Browser";
    if (/Linux/i.test(ua)) return "Linux Browser";

    return "Web Browser";
}

export function getNotificationPermissionStatus() {
    if (!canUseNotificationsApi()) return "unsupported";
    return Notification.permission;
}

export function getSavedFcmToken() {
    if (!canUseBrowserApis()) return null;
    return localStorage.getItem(LOCAL_FCM_TOKEN_KEY);
}

export function clearSavedFcmToken() {
    if (!canUseBrowserApis()) return;
    localStorage.removeItem(LOCAL_FCM_TOKEN_KEY);
}

function saveFcmToken(token) {
    if (!canUseBrowserApis() || !token) return;
    localStorage.setItem(LOCAL_FCM_TOKEN_KEY, token);
}

async function fetchFcmToken() {
    const supported = await getMessagingSupport();
    if (!supported) return null;

    if (!canUseNotificationsApi()) return null;
    if (Notification.permission !== "granted") return null;

    const swReg = await getActiveServiceWorkerRegistration();
    if (!swReg) return null;

    const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg,
    });

    if (token) saveFcmToken(token);

    return token || null;
}

export async function registerNotificationTokenWithBackend(token) {
    if (!token) return null;

    const payload = {
        fcmToken: token,
        deviceType: getDeviceType(),
        deviceName: getDeviceName(),
        userAgent: canUseBrowserApis() ? navigator.userAgent || "" : "",
    };

    const res = await api.post(`${DEVICE_TOKEN_BASE}/register`, payload);
    return res?.data?.data ?? null;
}

export async function enableNotifications() {
    const supported = await getMessagingSupport();
    if (!supported) return null;

    if (!canUseNotificationsApi()) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    return await fetchFcmToken();
}

export async function enableAndRegisterNotifications() {
    const token = await enableNotifications();
    if (!token) return null;

    await registerNotificationTokenWithBackend(token);
    return token;
}

export async function syncExistingNotificationToken() {
    const token = await fetchFcmToken();
    if (!token) return null;

    await registerNotificationTokenWithBackend(token);
    return token;
}

export async function disableCurrentDeviceNotifications() {
    const token = getSavedFcmToken();
    if (!token) return false;

    await api.post(`${DEVICE_TOKEN_BASE}/deactivate`, { fcmToken: token });
    clearSavedFcmToken();
    return true;
}

export async function getMyRegisteredNotificationDevices() {
    const res = await api.get(`${DEVICE_TOKEN_BASE}/my`);
    return res?.data?.data || [];
}

export function listenForeground(handler) {
    return onMessage(messaging, handler);
}