const admin = require("firebase-admin");
require("dotenv").config(); // .env yüklemek için

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

async function sendNotification(tokens, title, body) {
  const message = {
    notification: { title, body },
    tokens,
  };
  const response = await admin.messaging().sendMulticast(message);
  console.log("Sent:", response.successCount, "Failed:", response.failureCount);
}

module.exports = { sendNotification };
