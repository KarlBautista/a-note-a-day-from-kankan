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

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'New Message';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new message',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'love-note',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Message',
        icon: '/vite.svg'
      }
    ],
    data: {
      url: self.location.origin
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // If the app is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If the app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
    );
  }
});
