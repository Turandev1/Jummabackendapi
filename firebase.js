// backend/firebase.js
const admin = require("firebase-admin");
require("dotenv").config();

const LOG = (...args) =>
  console.log(new Date().toISOString(), "[FCM]", ...args);
const ERROR = (...args) =>
  console.error(new Date().toISOString(), "[FCM][ERROR]", ...args);

const validateFirebaseConfig = () => {
  const required = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_SENDER_ID",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    ERROR("Missing Firebase env vars:", missing);
    process.exit(1);
  }
  LOG("Firebase env vars present (masked):", {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL:
      process.env.FIREBASE_CLIENT_EMAIL &&
      (process.env.FIREBASE_CLIENT_EMAIL.length > 30
        ? "..." + process.env.FIREBASE_CLIENT_EMAIL.slice(-30)
        : process.env.FIREBASE_CLIENT_EMAIL),
    FIREBASE_SENDER_ID: process.env.FIREBASE_SENDER_ID,
  });
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
  LOG("Firebase admin initialized successfully");
} catch (initErr) {
  ERROR("Failed to initialize Firebase admin:", initErr);
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
    LOG("Preparing to send FCM notification", {
      tokenCount: tokens ? tokens.length : 0,
      title,
      body,
      dataKeys: Object.keys(data),
    });

    if (!tokens || !tokens.length) {
      LOG("No tokens provided for FCM notification — aborting");
      return { successCount: 0, failureCount: 0, note: "no-tokens" };
    }

    const validTokens = tokens.filter(
      (token) => token && typeof token === "string" && token.trim().length > 0
    );

    LOG("Valid token count:", validTokens.length);
    if (!validTokens.length) {
      LOG("No valid tokens after filtering — aborting");
      return { successCount: 0, failureCount: 0, note: "no-valid-tokens" };
    }

    // Mask tokens in logs (show last 6 chars) for privacy
    const tokenSamples = validTokens.slice(0, 6).map((t) => {
      const s = t.trim();
      return s.length > 10 ? "..." + s.slice(-10) : s;
    });
    LOG("Token samples (masked):", tokenSamples);

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

    LOG("Constructed message object for FCM (fields shown):", {
      hasNotification: !!message.notification,
      dataKeys: Object.keys(message.data),
      android: !!message.android,
      apns: !!message.apns,
    });

    // Try preferred multicast method; fallback if not available (robust to SDK differences)
    let response;
    let responsesArray = [];

    const messaging = admin.messaging();

    if (typeof messaging.sendMulticast === "function") {
      LOG("Using admin.messaging().sendMulticast()");
      response = await messaging.sendMulticast(message);
      responsesArray = response.responses || [];
    } else if (typeof messaging.sendAll === "function") {
      LOG(
        "admin.messaging().sendMulticast not available, falling back to sendAll()"
      );
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
      LOG(
        "Neither sendMulticast nor sendAll available on admin.messaging(), falling back to per-token send()"
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

    // Process responses to find invalid tokens or errors
    const invalidTokens = [];
    let successCount = 0;
    let failureCount = 0;

    responsesArray.forEach((resp, idx) => {
      // For unified handling handle both shapes (sendMulticast/sendAll) and fallback per-send
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
        LOG(
          `Token ${idx} failed — masked: ${
            validTokens[idx] ? "..." + validTokens[idx].slice(-10) : "n/a"
          }`,
          { code, message: messageText }
        );
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
      LOG(
        `Detected ${invalidTokens.length} invalid tokens (sample):`,
        invalidTokens.slice(0, 6)
      );
      // Burada DB’den silme işlemi yapılabilir
    }

    LOG("FCM send result:", { successCount, failureCount });
    return {
      successCount,
      failureCount,
      invalidTokens,
      rawResponse: response,
    };
  } catch (error) {
    ERROR(
      "FCM send error (unexpected):",
      error && error.stack ? error.stack : error
    );
    throw error;
  }
};

module.exports = { sendFCMNotification };
