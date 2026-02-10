import { getToken, onMessage } from "firebase/messaging";
import { messaging, vapidKey } from "./firebase";

// Register SW and wait until it's ACTIVE
async function getActiveServiceWorkerRegistration() {
    if (!("serviceWorker" in navigator)) return null;


    await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    // ✅ Wait until SW is ready (active + controlling page)
    const reg = await navigator.serviceWorker.ready;

    return reg;
}

export async function enableNotifications() {
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

    console.log("FCM TOKEN:", token);
    return token;
}

export function listenForeground(handler) {
    return onMessage(messaging, handler);
}
