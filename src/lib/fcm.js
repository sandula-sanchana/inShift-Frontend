import { getToken, onMessage } from "firebase/messaging";
import { messaging, vapidKey } from "./firebase";


// REGISTER SERVICE WORKER


async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;

    return await navigator.serviceWorker.register("/firebase-messaging-sw.js");
}


// ENABLE NOTIFICATIONS


export async function enableNotifications() {

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        console.log("User blocked notifications");
        return null;
    }

    const sw = await registerServiceWorker();

    const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: sw
    });

    console.log("FCM TOKEN:", token);

    return token;
}


// FOREGROUND MESSAGES

export function listenForeground(handler) {
    return onMessage(messaging, handler);
}
