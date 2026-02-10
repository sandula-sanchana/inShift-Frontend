import firebase from "firebase/compat/app";


// eslint-disable-next-line no-undef
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
// eslint-disable-next-line no-undef
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBXgUWgOqXOgcfR28_AU5NdzdKSi6iOd7g",
    authDomain: "inshift-8b9f0.firebaseapp.com",
    projectId: "inshift-8b9f0",
    storageBucket: "inshift-8b9f0.firebasestorage.app",
    messagingSenderId: "311906880354",
    appId: "1:311906880354:web:c77d8c6679baa08db33a3b"
});

const messaging = firebase.messaging();


// BACKGROUND NOTIFICATIONS


messaging.onBackgroundMessage((payload) => {

    const title = payload?.notification?.title ?? "InShift";
    const body = payload?.notification?.body ?? "";

    // 🔥 backend send this

    const url = payload?.data?.url ?? "/app/notifications";

    self.registration.showNotification(title, {
        body,
        data: { url }
    });
});


// CLICK → OPEN PAGE

self.addEventListener("notificationclick", (event) => {

    event.notification.close();

    const url = event.notification?.data?.url ?? "/app/notifications";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {

                for (const client of clientList) {
                    if (client.url.includes("/app") && "focus" in client) {
                        client.postMessage({ type: "NAVIGATE", url });
                        return client.focus();
                    }
                }

                return clients.openWindow(url);
            })
    );
});
