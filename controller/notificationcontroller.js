// backend/controller/notificationcontroller.js
const User = require("../schema/Users");
const Imam = require("../schema/Admin");
const Notification = require("../schema/notification");
const { sendFCMNotification } = require("../firebase");

const LOG = (...args) =>
  console.log(new Date().toISOString(), "[NOTIF-CTRL]", ...args);
const ERROR = (...args) =>
  console.error(new Date().toISOString(), "[NOTIF-CTRL][ERROR]", ...args);

exports.sendcumanotification = async (req, res) => {
  try {
    LOG("Incoming sendcumanotification request", {
      body: req.body,
      ip:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress,
    });

    const { senderId, title, body, mescidId } = req.body;

    if (!senderId || !title || !body || !mescidId) {
      LOG("Bad request — missing fields", { senderId, title, body, mescidId });
      return res.status(400).json({ error: "Eksik veri" });
    }

    const sender = await Imam.findById(senderId).lean();
    if (!sender) {
      LOG("Sender not found for senderId:", senderId);
      return res.status(404).json({ error: "Imam bulunamadı" });
    }
    LOG("Found sender", { senderId, name: sender.name, role: sender.role });

    const users = await User.find({
      "cumemescidi.id": mescidId,
      fcmToken: { $exists: true, $ne: [] },
    })
      .select("_id fcmToken cumemescidi")
      .lean();

    LOG("DB query for users returned", { usersCount: users.length });

    const tokens = users.flatMap((u) => u.fcmToken || []).filter(Boolean);
    LOG("Flattened tokens count:", tokens.length);

    if (!tokens.length) {
      LOG("No tokens to send to — returning 404");
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    try {
      LOG("Calling sendFCMNotification with tokens...");
      const sendResult = await sendFCMNotification(tokens, title, body, {
        screen: "mainpage",
        mescidId: String(mescidId),
        senderId: String(senderId),
        senderName: sender.name,
        type: "cumaNotification",
      });
      LOG("sendFCMNotification result:", sendResult);

      // DB’ye kaydet
      const notificationDoc = new Notification({
        title,
        body,
        senderId: sender._id,
        senderRole: sender.role,
        senderName: `${sender.name} ${sender.surname || ""}`.trim(),
        mescidId,
        sentTo: users.map((u) => u._id),
        sentCount: sendResult.successCount || users.length,
        status: sendResult && sendResult.failureCount > 0 ? "partial" : "sent",
        data: {
          screen: "MainPage",
          params: { mescidId, senderName: sender.name },
          customKey: "cumaNotification",
        },
        meta: {
          fcmRaw: sendResult.rawResponse || null,
          invalidTokensCount:
            (sendResult.invalidTokens && sendResult.invalidTokens.length) || 0,
        },
      });

      const saved = await notificationDoc.save();
      LOG("Notification saved to DB with id:", saved._id);

      res.json({
        success: true,
        sentCount: sendResult.successCount || users.length,
        failureCount: sendResult.failureCount || 0,
        invalidTokens: (sendResult.invalidTokens || []).slice(0, 10),
        notificationId: saved._id,
      });
    } catch (sendErr) {
      ERROR("Error while sending FCM or saving notification:", sendErr);
      return res.status(500).json({ error: "Bildirim gönderilirken hata" });
    }
  } catch (err) {
    ERROR(
      "Unhandled server error in sendcumanotification:",
      err && err.stack ? err.stack : err
    );
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
