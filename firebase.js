const admin = require("firebase-admin");
require("dotenv").config();

const validateFirebaseConfig = () => {
  const required = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_SENDER_ID",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error("❌ Missing Firebase env vars:", missing);
    process.exit(1);
  }
};
validateFirebaseConfig();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const sendFCMNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || !tokens.length) {
    console.warn("⚠️ No tokens provided for FCM notification");
    return;
  }

  const validTokens = tokens.filter(
    (token) => token && typeof token === "string" && token.trim().length > 0
  );
  if (!validTokens.length) {
    console.warn("⚠️ No valid tokens found for FCM notification");
    return;
  }

  const message = {
    notification: { title, body }, // 🔹 banner için
    data, // 🔹 foreground listener için
    tokens: validTokens,
    android: {
      notification: {
        channelId: "default",
        sound: "default",
        priority: "high",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(
          `❌ Token ${validTokens[idx]} error:`,
          resp.error.code,
          resp.error.message
        );
        if (
          resp.error.code === "messaging/invalid-registration-token" ||
          resp.error.code === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(validTokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      console.log(`🧹 Removing ${invalidTokens.length} invalid tokens from DB`);
      // Burada DB’den silme işlemi yapılabilir
    }

    console.log("✅ Bildirim gönderildi:", response.successCount, "başarılı");
    return response;
  } catch (error) {
    console.error("❌ FCM send error:", error);
    throw error;
  }
};

module.exports = { sendFCMNotification };
