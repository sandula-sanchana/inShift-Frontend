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

messaging.onBackgroundMessage(function (payload) {
    var title =
        payload && payload.notification && payload.notification.title
            ? payload.notification.title
            : "InShift";

    var body =
        payload && payload.notification && payload.notification.body
            ? payload.notification.body
            : "";

    var url =
        payload && payload.data && payload.data.url
            ? payload.data.url
            : "/emp/notifications";

    var presenceCheckId =
        payload && payload.data && payload.data.presenceCheckId
            ? payload.data.presenceCheckId
            : null;

    var sourceExpected =
        payload && payload.data && payload.data.sourceExpected
            ? payload.data.sourceExpected
            : "ANY";

    self.registration.showNotification(title, {
        body: body,
        data: {
            url: url,
            presenceCheckId: presenceCheckId,
            sourceExpected: sourceExpected,
            type: payload && payload.data ? payload.data.type : null
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

                // only reuse tabs that belong to this app origin
                if (client && "url" in client && client.url && client.url.indexOf(self.location.origin) === 0) {
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