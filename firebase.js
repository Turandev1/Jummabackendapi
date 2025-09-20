const admin = require("firebase-admin");
require("dotenv").config(); // .env yüklemek için


const validateFirebaseConfig = () => {
  const required = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
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
  if (!tokens.length) return;

  const message = {
    notification: {
      title,
      body,
    },
    data, // custom key-value pair
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("FCM response:", response);
   

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(
            `❌ Token ${tokens[idx]} error:`,
            resp.error.code,
            resp.error.message
          );
        }
      });

   
   
    return response;

  } catch (error) {
    console.error("FCM send error:", error);
    throw error;
  }
};



module.exports = { sendFCMNotification };
