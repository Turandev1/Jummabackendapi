// backend/firebase.js
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
    console.error("[Firebase Config Error] Missing env variables:", missing);
    process.exit(1);
  }
};
validateFirebaseConfig();

try {
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || "";
  const privateKey = privateKeyRaw.includes("\\n")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : privateKeyRaw;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });

  console.log("[Firebase] Initialized successfully.");
} catch (initErr) {
  console.error("[Firebase Init Error]", initErr);
  throw initErr;
}

/**
 * sendFCMNotification
 * tokens: array
 * title, body: strings
 * data: object (custom data)
 */
const sendFCMNotification = async (tokens, title, body, data = {}) => {
  try {
    console.log("[FCM] Preparing to send notification...");
    console.log(`[FCM] Incoming tokens count: ${tokens?.length || 0}`);
    console.log(`[FCM] Notification Title: "${title}", Body: "${body}"`);

    if (!tokens || !tokens.length) {
      console.warn("[FCM] No tokens provided.");
      return { successCount: 0, failureCount: 0, note: "no-tokens" };
    }

    const validTokens = tokens.filter(
      (token) => token && typeof token === "string" && token.trim().length > 0
    );

    if (!validTokens.length) {
      console.warn("[FCM] No valid tokens found.");
      return { successCount: 0, failureCount: 0, note: "no-valid-tokens" };
    }

    // Mask tokens in logs
    const tokenSamples = validTokens.slice(0, 6).map((t) => {
      const s = t.trim();
      return s.length > 10 ? "..." + s.slice(-10) : s;
    });
    console.log("[FCM] Sending to token samples:", tokenSamples);

    const message = {
      tokens: validTokens,
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        ...data,
      },
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

    const messaging = admin.messaging();

    let response;
    let responsesArray = [];

    if (typeof messaging.sendMulticast === "function") {
      console.log("[FCM] Using sendMulticast...");
      response = await messaging.sendMulticast(message);
      responsesArray = response.responses || [];
    } else if (typeof messaging.sendAll === "function") {
      console.log("[FCM] sendMulticast not available, using sendAll...");
      const messages = validTokens.map((t) => ({
        token: t,
        notification: { title, body },
        data,
        android: message.android,
        apns: message.apns,
      }));
      response = await messaging.sendAll(messages);
      responsesArray = response.responses || [];
    } else {
      console.log(
        "[FCM] sendMulticast/sendAll not available, sending individually..."
      );
      const perResponses = await Promise.all(
        validTokens.map(async (t) => {
          try {
            const r = await messaging.send({
              token: t,
              notification: { title, body },
              data,
              android: message.android,
              apns: message.apns,
            });
            return { success: true, messageId: r };
          } catch (err) {
            console.error("[FCM] Error sending to token:", t, err);
            return { success: false, error: err };
          }
        })
      );
      responsesArray = perResponses;
      response = {
        successCount: perResponses.filter((r) => r.success).length,
        failureCount: perResponses.filter((r) => !r.success).length,
        responses: perResponses,
      };
    }

    const invalidTokens = [];
    let successCount = 0;
    let failureCount = 0;

    responsesArray.forEach((resp, idx) => {
      const isSuccess = !!resp.success;
      if (isSuccess) {
        successCount++;
      } else {
        failureCount++;
        const err = resp.error || resp.exception || resp;
        const code = err && err.code ? err.code : "unknown";
        const messageText =
          (err && (err.message || (err.toString && err.toString()))) ||
          String(err);

        console.warn(`[FCM] Error for token [${idx}]:`, {
          code,
          message: messageText,
        });

        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered" ||
          /invalid/i.test(messageText)
        ) {
          invalidTokens.push(validTokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      console.log("[FCM] Invalid tokens detected:", invalidTokens);
      // DB'den silme işlemi yapılabilir
    }

    console.log("[FCM] Notification sending completed.", {
      successCount,
      failureCount,
    });

    return {
      successCount,
      failureCount,
      invalidTokens,
      rawResponse: response,
    };
  } catch (error) {
    console.error("[FCM] Unexpected error:", error);
    throw error;
  }
};

module.exports = { sendFCMNotification };
