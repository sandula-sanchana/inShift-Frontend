import { getToken, onMessage, isSupported } from "firebase/messaging";
import { messaging, vapidKey } from "./firebase";

async function getActiveServiceWorkerRegistration() {
    if (!("serviceWorker" in navigator)) return null;

    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    return await navigator.serviceWorker.ready;
}

export async function enableNotifications() {
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;

    if (!("Notification" in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        console.log("User blocked notifications");
        return null;
    }

    const swReg = await getActiveServiceWorkerRegistration();
    if (!swReg) return null;

    const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg
    });

    return token || null;
}

export function listenForeground(handler) {
    return onMessage(messaging, handler);
}