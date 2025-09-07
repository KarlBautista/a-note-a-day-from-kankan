import express from "express";
import cors from "cors";
import { createRequire } from "module";
import cron from "node-cron"; // 👈 install this: npm install node-cron
import { supabase } from "./database/supabaseClient.js"
const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccount.json");
const admin = require("firebase-admin");

const app = express();
const PORT = 4000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));


app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("Firebase Admin initialized");

let tokens = [];
  
app.post("/save-token", async (req, res) => {
  const { token } = req.body;

  try {
    // Check if token already exists
    const { data: existing } = await supabase
      .from("FCM")
      .select("id")
      .eq("FCM", token)
      .single();

    if (existing) {
      return res.status(200).json({ success: true, message: "Token already exists" });
    }

    // Save new token
    const { error } = await supabase.from("FCM").insert({ FCM: token });

    if (error) {
      return res.status(500).json({ success: false, error });
    }

    res.status(200).json({ success: true, message: "Token saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a token (disable notifications)
app.post("/delete-token", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required" });
  }

  try {
    const { error } = await supabase
      .from("FCM")
      .delete()
      .eq("FCM", token);

    if (error) {
      return res.status(500).json({ success: false, error });
    }

    res.status(200).json({ success: true, message: "Notifications disabled successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// Manual notification endpoint (still works)
app.post("/send-notification", async (req, res) => {
  const { title, body, token } = req.body;

  try {
    let tokensToSend = [];

    // If specific token provided, use it. Otherwise, get all tokens
    if (token) {
      tokensToSend = [{ FCM: token }];
    } else {
      const { data: tokenData, error: tokenError } = await supabase.from("FCM").select("*");
      if (tokenError) {
        return res.status(500).json({ success: false, error: tokenError });
      }
      tokensToSend = tokenData || [];
    }

    if (tokensToSend.length === 0) {
      return res.status(200).json({ success: false, message: "No tokens to send notifications." });
    }

    let successCount = 0;
    let failedTokens = [];

    for (const row of tokensToSend) {
      try {
        await admin.messaging().send({
          notification: { 
            title: title || "💌 A Note from Kankan", 
            body: body || "You have a new message!"
          },
          token: row.FCM,
          webpush: {
            fcmOptions: {
              link: "https://your-vercel-app.vercel.app"
            }
          }
        });
        successCount++;
        console.log("✅ Notification sent to:", row.FCM.substring(0, 20) + "...");
      } catch (sendErr) {
        console.error("❌ Failed to send to token:", row.FCM.substring(0, 20) + "...", sendErr.message);
        failedTokens.push(row.FCM);
        
        // Remove invalid tokens from database
        if (sendErr.code === 'messaging/registration-token-not-registered') {
          await supabase.from("FCM").delete().eq("FCM", row.FCM);
          console.log("🗑️ Removed invalid token from database");
        }
      }
    }

    console.log(`📊 Notifications sent: ${successCount}/${tokensToSend.length}`);
    res.json({ 
      success: true, 
      sent: successCount, 
      total: tokensToSend.length,
      failed: failedTokens.length 
    });
  } catch (err) {
    console.error("❌ Unexpected error in /send-notification:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test endpoint to check if backend is working
app.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Backend is working!", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Get all tokens (for debugging)
app.get("/tokens", async (req, res) => {
  try {
    const { data: tokenData, error } = await supabase.from("FCM").select("*");
    if (error) {
      return res.status(500).json({ success: false, error });
    }
    
    res.json({ 
      success: true, 
      count: tokenData?.length || 0,
      tokens: tokenData?.map(t => ({ 
        id: t.id, 
        token: t.FCM.substring(0, 20) + "..." 
      })) || []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


cron.schedule("58 2 * * *", async () => {
  console.log("Running scheduled notification (2:58 AM)...");

  try {
    const { data: tokenData, error } = await supabase.from("FCM").select("*");
    if (error) {
      console.error("Error fetching tokens:", error);
      return;
    }

    if (!tokenData || tokenData.length === 0) {
      console.log("No tokens saved, skipping notification.");
      return;
    }

    for (const row of tokenData) {
      await admin.messaging().send({
        notification: {
          title: "💌 A Note from Kankan",
          body: "Good morning ganing! Here's your daily note ❤️"
        },
        token: row.FCM
      });
    }

    console.log("Daily notifications sent successfully!");
  } catch (err) {
    console.error("Error sending daily notification:", err);
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
