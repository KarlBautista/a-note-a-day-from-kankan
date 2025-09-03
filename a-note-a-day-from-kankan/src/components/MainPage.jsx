import React, { useState, useEffect } from 'react';
import "../styles/MainPage.css";
import NoteCard from './NoteCard';
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import axios from "axios"; 

const firebaseConfig = {
  apiKey: "AIzaSyCQVtUDOUoZO896lQT_O6OZ5M-XExRsrBQ",
  authDomain: "a-note-a-day-from-kankan.firebaseapp.com",
  projectId: "a-note-a-day-from-kankan",
  storageBucket: "a-note-a-day-from-kankan.firebasestorage.app",
  messagingSenderId: "134290037292",
  appId: "1:134290037292:web:69e275038692272fa48f89",
  measurementId: "G-L5MSMDE4HD"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const MainPage = () => {
  const [notificationPerm, setNotificationPerm] = useState("");
    const [fcmToken, setFcmToken] = useState(""); // ✅ store token in state
  useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);

        // Only try to get token if notification is granted
        if (Notification.permission === 'granted') {
          getToken(messaging, {
            vapidKey: "BNk3jZlY8b_kSxdXCVaoVehx_tWygsxDRuP6YMNH-8-N4bfQHacnsI3cKq3-LOx2hIMBDFSu_zqI3OySLH2y5q0",
            serviceWorkerRegistration: registration
          }).then((token) => {
            if (token) {
              console.log("FCM Token from SW:", token);
              setFcmToken(token);
              setNotificationPerm('enabled');
            }
          }).catch(err => console.error('Error getting token:', err));
        }
      })
      .catch(err => console.error('Service Worker registration failed:', err));
  }
}, []);

  useEffect(() => {
    if (Notification.permission === "granted") {
      getToken(messaging, {
        vapidKey: "BNk3jZlY8b_kSxdXCVaoVehx_tWygsxDRuP6YMNH-8-N4bfQHacnsI3cKq3-LOx2hIMBDFSu_zqI3OySLH2y5q0"
      }).then((token) => {
        if (token) {
          setNotificationPerm("enabled");
        }
      });
    }
  }, []);


const requestPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    try {
      // Register SW
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: "BNk3jZlY8b_kSxdXCVaoVehx_tWygsxDRuP6YMNH-8-N4bfQHacnsI3cKq3-LOx2hIMBDFSu_zqI3OySLH2y5q0",
        serviceWorkerRegistration: registration
      });

      if (!token) return;
      console.log("FCM Token:", token);
      setFcmToken(token);

      // Save token to server
      const res = await axios.post("https://a-note-a-day-for-angila.onrender.com/save-token", { token });
      if (res.data.success) setNotificationPerm("enabled");

      // Send immediate notification (for testing)
      await axios.post("https://a-note-a-day-for-angila.onrender.com/send-notification", {
        title: "Hello Ganinggg!",
        body: "You enabled notifications! 💌"
      });

    } catch (err) {
      console.error("Failed to get token or send notification:", err);
    }
  }
};


  const disableNotifications = async () => {
    console.log(fcmToken)
    try {
      if (!fcmToken) return; // ✅ use token from state

      await axios.post("https://a-note-a-day-for-angila.onrender.com/delete-token", { token: fcmToken });
      setNotificationPerm("disabled");
      setFcmToken(""); // clear token
      new Notification("You disabled the notification🥲")
    } catch (err) {
      console.error("Failed to disable notifications", err);
    }
  };


 onMessage(messaging, (payload) => {
  console.log("Foreground message received:", payload);
  new Notification(payload.notification?.title, {
    body: payload.notification?.body
  });
});


  return (
    <div className='main-page'>
      <div className='content-container'>
        <header className='header-section'>
          <h1>♡ A Note a Day For Angila ♡</h1>
          <h2>Because every day with you ganing is special</h2>
        </header>
        
        <main className='main-content'>
          <NoteCard />
        </main>
        
        <section className='notification-section'>
          {notificationPerm === "enabled" && (
            <p id='notification-label'>💌 You will now get a notification everydayyy, ganingg! 💌</p>
          )}
          
          <button onClick={notificationPerm === "enabled" ? disableNotifications : requestPermission}>
            {notificationPerm === "enabled" ? "Disable Notifications 😢" : "Enable Notifications"}
          </button>
        </section>
      </div>
      
      <footer>♡ Made with love for the love of my life ♡</footer>
    </div>
  );
};

export default MainPage;
