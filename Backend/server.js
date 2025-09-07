import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createRequire } from "module";
import cron from "node-cron"; // 👈 install this: npm install node-cron
import { supabase } from "./database/supabaseClient.js"
const require = createRequire(import.meta.url);
const admin = require("firebase-admin");
let serviceAccount = null;

// Prefer credentials from environment for Render/hosting
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    console.log("Using Firebase Admin credentials from env");
  } catch (e) {
    console.error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON env", e);
  }
}

// Fallback to local file during development
if (!serviceAccount) {
  try {
    serviceAccount = require("./serviceAccount.json");
    console.log("Using Firebase Admin credentials from local file");
  } catch (e) {
    console.error("No valid Firebase Admin credentials found.");
  }
}

const app = express();
const PORT = process.env.PORT || 4000;

// Frontend URL for notification click-throughs
const FRONTEND_URL = process.env.FRONTEND_URL || "https://a-note-a-day-from-kankan.vercel.app";

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));


app.use(express.json());

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  throw new Error("Firebase Admin credentials are missing. Set GOOGLE_APPLICATION_CREDENTIALS_JSON or provide serviceAccount.json");
}

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
      token: row.FCM,
      // Send data-only so client/Service Worker controls display in all cases
      data: {
        title: title || "💌 A Note from Kankan",
        body: body || "You have a new message!",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        url: FRONTEND_URL
      },
      webpush: {
        fcmOptions: {
          link: FRONTEND_URL
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


// Schedule a daily notification at 08:00 using server timezone or CRON_TZ env
// Set CRON_TZ (e.g., Asia/Manila) in your environment for local time delivery
cron.schedule(
  "0 8 * * *",
  async () => {
    console.log("Running scheduled notification (08:00)...");

    const scheduledTitle = "💌 A Note from Kankan";
    const scheduledBody = "Your daily note is ready!";

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

      let sent = 0;
      for (const row of tokenData) {
        try {
          await admin.messaging().send({
            token: row.FCM,
            data: {
              title: scheduledTitle,
              body: scheduledBody,
              click_action: "FLUTTER_NOTIFICATION_CLICK",
              url: FRONTEND_URL
            },
            webpush: {
              fcmOptions: {
                link: FRONTEND_URL
              }
            }
          });
          sent++;
        } catch (sendErr) {
          console.error("❌ Failed to send scheduled to token:", row.FCM.substring(0, 20) + "...", sendErr.message);
          if (sendErr.code === 'messaging/registration-token-not-registered') {
            await supabase.from("FCM").delete().eq("FCM", row.FCM);
            console.log("🗑️ Removed invalid token from database");
          }
        }
      }

      console.log(`Daily notifications sent successfully! ${sent}/${tokenData.length}`);
    } catch (err) {
      console.error("Error sending daily notification:", err);
    }
  },
  { timezone: process.env.CRON_TZ || undefined }
);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
