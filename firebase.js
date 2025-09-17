const admin = require("firebase-admin");
const serviceAccount = require("./firebase-adminsdk.json"); // Firebase Console → Project Settings → Service Accounts → JSON indir

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function sendNotification(tokens, title, body) {
  const message = {
    notification: { title, body },
    tokens,
  };
  const response = await admin.messaging().sendMulticast(message);
  console.log("Sent:", response.successCount, "Failed:", response.failureCount);
}
