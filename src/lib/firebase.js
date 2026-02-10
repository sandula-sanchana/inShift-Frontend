import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyBXgUWgOqXOgcfR28_AU5NdzdKSi6iOd7g",
    authDomain: "inshift-8b9f0.firebaseapp.com",
    projectId: "inshift-8b9f0",
    storageBucket: "inshift-8b9f0.firebasestorage.app",
    messagingSenderId: "311906880354",
    appId: "1:311906880354:web:c77d8c6679baa08db33a3b"
};

const app = initializeApp(firebaseConfig);

// 🔥 THIS activates push notifications
export const messaging = getMessaging(app);

// ✅mage VAPID key
export const vapidKey =
    "BOCtZVGQqqm1mEUV3Kaa59yFm3Ztj1y1uuJwMw2cSXR8yy6K_s64lYOVY40xEFlAM3J6wykc2ruzCdpg2-n9PXc";
