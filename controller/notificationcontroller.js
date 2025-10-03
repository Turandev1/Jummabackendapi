// backend/controller/notificationcontroller.js
const User = require("../schema/Users");
const Imam = require("../schema/Admin");
const Notification = require("../schema/notification");
const { sendFCMNotification } = require("../firebase");

exports.sendcumanotification = async (req, res) => {
  try {
    const { senderId, title, body, mescidId } = req.body;

    if (!senderId || !title || !body || !mescidId) {
      return res.status(400).json({ error: "Eksik veri" });
    }

    // Gönderen imamı bul
    const sender = await Imam.findById(senderId).lean();
    if (!sender) {
      return res.status(404).json({ error: "Imam bulunamadı" });
    }

    // MescidId'ye bağlı kullanıcıları bul
    const users = await User.find({
      "cumemescidi.id": mescidId,
      fcmToken: { $exists: true, $ne: [] },
    })
      .select("_id fcmToken cumemescidi")
      .lean();

    const tokens = users.flatMap((u) => u.fcmToken || []).filter(Boolean);

    if (!tokens.length) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    try {
      // FCM gönderimi
      const sendResult = await sendFCMNotification(tokens, title, body, {
        screen: "mainpage",
        mescidId: String(mescidId),
        senderId: String(senderId),
        senderName: sender.name,
        type: "cumaNotification",
      });

      
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
        status: "pending",
        data: {
          screen: "mainpage",
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

      res.json({
        success: true,
        sentCount: sendResult.successCount || users.length,
        failureCount: sendResult.failureCount || 0,
        invalidTokens: (sendResult.invalidTokens || []).slice(0, 10),
        notificationId: saved._id,
      });
    } catch (sendErr) {
      return res.status(500).json({ error: "Bildirim gönderilirken hata" });
    }
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
