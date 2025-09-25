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
const sendFCMNotification = async (tokens, title, body, data = {}) => {
  if (!tokens.length) return;

  const chunkSize = 500; // FCM max 500 token/batch
  const batches = [];
    
  // 🔹 Tokenları 500'lü batchlere ayır
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
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

      // 🔹 Hatalı tokenleri logla
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(
            `❌ Token ${chunk[idx]} error:`,
            resp.error.code,
            resp.error.message
          );
        }
      });

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
