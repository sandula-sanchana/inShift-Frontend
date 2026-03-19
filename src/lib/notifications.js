import { getToken, onMessage, isSupported } from "firebase/messaging";
import { messaging, vapidKey } from "./firebase";
import { api } from "./api.js";

const DEVICE_TOKEN_BASE = "/api/v1/emp/device-tokens";
const LOCAL_FCM_TOKEN_KEY = "inshift_fcm_token";

async function getActiveServiceWorkerRegistration() {
    if (!("serviceWorker" in navigator)) return null;

    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    return await navigator.serviceWorker.ready;
}

function getDeviceType() {
    const ua = navigator.userAgent || "";

    if (/Android/i.test(ua)) return "ANDROID";
    if (/iPhone|iPad|iPod/i.test(ua)) return "IOS";
    if (/Windows/i.test(ua)) return "WINDOWS";
    if (/Macintosh|Mac OS X/i.test(ua)) return "MAC";
    if (/Linux/i.test(ua)) return "LINUX";

    return "WEB";
}

function getDeviceName() {
    const ua = navigator.userAgent || "";

    if (/Android/i.test(ua)) return "Android Browser";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone / iPad Browser";
    if (/Windows/i.test(ua)) return "Windows Browser";
    if (/Macintosh|Mac OS X/i.test(ua)) return "Mac Browser";
    if (/Linux/i.test(ua)) return "Linux Browser";

    return "Web Browser";
}

export async function enableNotifications() {
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;

    if (!("Notification" in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const swReg = await getActiveServiceWorkerRegistration();
    if (!swReg) return null;

    const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg,
    });

    if (token) {
        localStorage.setItem(LOCAL_FCM_TOKEN_KEY, token);
    }

    return token || null;
}

export async function syncExistingNotificationToken() {
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;

    if (!("Notification" in window)) return null;
    if (Notification.permission !== "granted") return null;

    const swReg = await getActiveServiceWorkerRegistration();
    if (!swReg) return null;

    const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg,
    });

    if (!token) return null;

    localStorage.setItem(LOCAL_FCM_TOKEN_KEY, token);

    const payload = {
        fcmToken: token,
        deviceType: getDeviceType(),
        deviceName: getDeviceName(),
        userAgent: navigator.userAgent || "",
    };

    await api.post(`${DEVICE_TOKEN_BASE}/register`, payload);

    return token;
}

export function listenForeground(handler) {
    return onMessage(messaging, handler);
}