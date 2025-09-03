// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCQVtUDOUoZO896lQT_O6OZ5M-XExRsrBQ",
  authDomain: "a-note-a-day-from-kankan.firebaseapp.com",
  projectId: "a-note-a-day-from-kankan",
  storageBucket: "a-note-a-day-from-kankan.firebasestorage.app",
  messagingSenderId: "134290037292",
  appId: "1:134290037292:web:69e275038692272fa48f89",
  measurementId: "G-L5MSMDE4HD"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
