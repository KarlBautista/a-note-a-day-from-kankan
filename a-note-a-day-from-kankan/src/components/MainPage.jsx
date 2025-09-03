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
  const [debugInfo, setDebugInfo] = useState("Initializing...");

  // Add debug logging
  const addDebugInfo = (info) => {
    console.log(info);
    setDebugInfo(prev => `${prev}\n${new Date().toLocaleTimeString()}: ${info}`);
  };
  useEffect(() => {
  console.log("🚀 Initializing service worker and notifications...");
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);

        // Only try to get token if notification is granted
        if (Notification.permission === 'granted') {
          console.log("🔔 Permission already granted, getting token...");
          getToken(messaging, {
            vapidKey: "BNk3jZlY8b_kSxdXCVaoVehx_tWygsxDRuP6YMNH-8-N4bfQHacnsI3cKq3-LOx2hIMBDFSu_zqI3OySLH2y5q0",
            serviceWorkerRegistration: registration
          }).then((token) => {
            if (token) {
              console.log("🎯 FCM Token from SW:", token);
              setFcmToken(token);
              setNotificationPerm('enabled');
            } else {
              console.warn("⚠️ No token received from service worker");
            }
          }).catch(err => console.error('❌ Error getting token:', err));
        } else {
          console.log("⚠️ Notification permission not granted:", Notification.permission);
        }
      })
      .catch(err => {
        console.error('❌ Service Worker registration failed:', err);
        
        // Fallback: try without service worker registration
        if (Notification.permission === 'granted') {
          console.log("🔄 Trying fallback without service worker...");
          getToken(messaging, {
            vapidKey: "BNk3jZlY8b_kSxdXCVaoVehx_tWygsxDRuP6YMNH-8-N4bfQHacnsI3cKq3-LOx2hIMBDFSu_zqI3OySLH2y5q0"
          }).then((token) => {
            if (token) {
              console.log("🎯 FCM Token (fallback):", token);
              setFcmToken(token);
              setNotificationPerm('enabled');
            }
          }).catch(err => console.error('❌ Error getting token (fallback):', err));
        }
      });
  } else {
    console.error("❌ Service Worker not supported in this browser");
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
  console.log("🔔 Requesting notification permission...");
  
  try {
    const permission = await Notification.requestPermission();
    console.log("Permission result:", permission);
    
    if (permission === "granted") {
      console.log("✅ Permission granted, getting FCM token...");
      
      try {
        // Try to get service worker registration
        let registration;
        try {
          registration = await navigator.serviceWorker.getRegistration();
          console.log("Service Worker registration:", registration);
        } catch (swError) {
          console.warn("Service Worker not available:", swError);
        }

        const token = await getToken(messaging, {
          vapidKey: "BNk3jZlY8b_kSxdXCVaoVehx_tWygsxDRuP6YMNH-8-N4bfQHacnsI3cKq3-LOx2hIMBDFSu_zqI3OySLH2y5q0",
          ...(registration && { serviceWorkerRegistration: registration })
        });

        if (!token) {
          console.error("❌ No FCM token received");
          alert("Failed to get notification token. Please try again.");
          return;
        }

        console.log("🎯 FCM Token received:", token);
        setFcmToken(token);

        // Save token to backend
        console.log("💾 Saving token to backend...");
        const res = await axios.post("https://a-note-a-day-for-angila.onrender.com/save-token", { token });
        console.log("Backend response:", res.data);
        
        if (res.data.success) {
          setNotificationPerm("enabled");
          console.log("✅ Notifications enabled successfully!");

          // Send test notification
          await axios.post("https://a-note-a-day-for-angila.onrender.com/send-notification", {
            title: "Hello Ganinggg!",
            body: "You enabled the notifications po ha, anytimee p'wede mo naman 'tong i-disable. Love youu poo.💌"
          });
        } else {
          console.error("❌ Backend failed to save token");
          alert("Failed to save notification settings. Please try again.");
        }
      } catch (tokenError) {
        console.error("❌ Failed to get token:", tokenError);
        alert(`Failed to setup notifications: ${tokenError.message}`);
      }
    } else if (permission === "denied") {
      console.log("❌ Permission denied");
      alert("Notifications are blocked. Please enable them in your browser settings.");
    } else {
      console.log("⚠️ Permission dismissed");
      alert("Notification permission was dismissed. Click the button again to enable.");
    }
  } catch (err) {
    console.error("❌ Permission request failed:", err);
    alert("Failed to request notification permission. Please try again.");
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
    new Notification(payload.notification.title, {
      body: payload.notification.body
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
          {/* Debug info */}
          <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px', textAlign: 'center' }}>
            Debug: Permission = {Notification.permission} | State = {notificationPerm} | Token = {fcmToken ? 'Available' : 'None'}
          </div>
          
          {notificationPerm === "enabled" && (
            <p id='notification-label'>💌 You will now get a notification everydayyy, ganingg! 💌</p>
          )}
          
          <button onClick={notificationPerm === "enabled" ? disableNotifications : requestPermission}>
            {notificationPerm === "enabled" ? "Disable Notifications 😢" : "Enable Notifications"}
          </button>
          
          {/* Test button for debugging */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={() => {
                console.log("🧪 Test notification button clicked");
                if (Notification.permission === 'granted') {
                  new Notification('Test Notification', {
                    body: 'This is a test notification from your app!'
                  });
                } else {
                  alert('Notifications not enabled!');
                }
              }}
              style={{ marginTop: '10px', fontSize: '0.8rem', padding: '8px 16px' }}
            >
              Test Local Notification
            </button>
          )}
        </section>
      </div>
      
      <footer>♡ Made with love for the love of my life ♡</footer>
    </div>
  );
};

export default MainPage;
