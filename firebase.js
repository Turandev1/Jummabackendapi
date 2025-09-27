const admin = require("firebase-admin");
require("dotenv").config(); // .env yüklemek için

// 🔹 Firebase config kontrolü
const validateFirebaseConfig = () => {
  const required = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_SENDER_ID", // Add SenderId validation
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error("❌ Missing Firebase env vars:", missing);
    process.exit(1);
  }
};
validateFirebaseConfig();

// 🔹 Firebase başlatma
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

// 🔹 FCM bildirim fonksiyonu
const sendFCMNotification = async (tokens, title, body, data = {},notification={}) => {
  if (!tokens || !tokens.length) {
    console.warn("⚠️ No tokens provided for FCM notification");
    return;
  }

  // Filter out invalid tokens
  const validTokens = tokens.filter(token => token && typeof token === 'string' && token.trim().length > 0);
  
  if (!validTokens.length) {
    console.warn("⚠️ No valid tokens found for FCM notification");
    return;
  }

  const chunkSize = 500; // FCM max 500 token/batch
  const batches = [];
  
  // 🔹 Tokenları 500'lü batchlere ayır
  for (let i = 0; i < validTokens.length; i += chunkSize) {
    const chunk = validTokens.slice(i, i + chunkSize);
    batches.push(chunk);
  }

  try {
    // 🔹 Batchleri paralel gönder
    const sendPromises = batches.map(async (chunk) => {
      const message = {
        notification: { title, body },
        data,
        tokens: chunk,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // 🔹 Hatalı tokenleri logla ve temizle
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(
            `❌ Token ${chunk[idx]} error:`,
            resp.error.code,
            resp.error.message
          );
          if (resp.error.code === 'messaging/invalid-registration-token' || 
              resp.error.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(chunk[idx]);
          }
        }
      });

      // Remove invalid tokens from database
      if (invalidTokens.length > 0) {
        console.log(`🧹 Removing ${invalidTokens.length} invalid tokens from database`);
        // This would need to be implemented to clean up invalid tokens
      }

      return response;
    });

    const allResponses = await Promise.all(sendPromises);
    console.log(
      "✅ FCM bildirimleri gönderildi:",
      allResponses.length,
      "batch"
    );

    return allResponses;
  } catch (error) {
    console.error("❌ FCM send error:", error);
    throw error;
  }
};

module.exports = { sendFCMNotification };
