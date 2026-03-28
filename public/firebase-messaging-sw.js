/* global importScripts, firebase, clients, self */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBXgUWgOqXOgcfR28_AU5NdzdKSi6iOd7g",
    authDomain: "inshift-8b9f0.firebaseapp.com",
    projectId: "inshift-8b9f0",
    storageBucket: "inshift-8b9f0.firebasestorage.app",
    messagingSenderId: "311906880354",
    appId: "1:311906880354:web:c77d8c6679baa08db33a3b"
});

var messaging = firebase.messaging();

function buildNotificationMeta(payload) {
    var data = payload && payload.data ? payload.data : {};
    var type = data.type || "GENERAL";
    var sourceExpected = data.sourceExpected || "ANY";
    var presenceCheckId = data.presenceCheckId || null;

    var title = data.title || "InShift";
    var body = data.body || "You have a new notification.";
    var url = data.url || "/emp/notifications";

    var meta = {
        title: title,
        body: body,
        url: url,
        type: type,
        sourceExpected: sourceExpected,
        presenceCheckId: presenceCheckId,
        tag: "inshift-general",
        requireInteraction: false,
        renotify: false,
        icon: "/noti_logo.png",
        badge: "/noti_logo.png"
    };

    if (type === "PRESENCE_CHECK") {
        meta.tag = presenceCheckId
            ? "presence-check-" + presenceCheckId
            : "presence-check";

        meta.requireInteraction = true;
        meta.renotify = true;

        if (!data.title) {
            meta.title = "Presence Verification Required";
        }

        if (!data.body) {
            if (sourceExpected === "COMPANY_PC") {
                meta.body = "Confirm from your approved company PC.";
            } else if (sourceExpected === "MOBILE_BIOMETRIC") {
                meta.body = "Confirm with biometric verification and GPS.";
            } else {
                meta.body = "Please confirm your presence now.";
            }
        }
    } else if (type === "ATTENDANCE") {
        meta.tag = "attendance-update";
    } else if (type === "SHIFT_UPDATE") {
        meta.tag = "shift-update";
    } else if (type === "OT_UPDATE") {
        meta.tag = "ot-update";
    } else if (type === "TEST_NOTIFICATION") {
        meta.tag = "test-notification";
    }

    return meta;
}

messaging.onBackgroundMessage(function (payload) {
    var meta = buildNotificationMeta(payload);

    self.registration.showNotification(meta.title, {
        body: meta.body,
        icon: meta.icon,
        badge: meta.badge,
        tag: meta.tag,
        renotify: meta.renotify,
        requireInteraction: meta.requireInteraction,
        data: {
            url: meta.url,
            presenceCheckId: meta.presenceCheckId,
            sourceExpected: meta.sourceExpected,
            type: meta.type
        }
    });
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    var url =
        event.notification &&
        event.notification.data &&
        event.notification.data.url
            ? event.notification.data.url
            : "/emp/notifications";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];

                if (client && "url" in client && client.url && client.url.indexOf(self.location.origin) === 0) {
                    if ("focus" in client) {
                        client.focus();
                    }

                    if ("navigate" in client) {
                        return client.navigate(url).then(function () {
                            return client.focus();
                        });
                    }

                    client.postMessage({
                        type: "NAVIGATE",
                        url: url
                    });

                    return client.focus();
                }
            }

            return clients.openWindow(url);
        })
    );
});