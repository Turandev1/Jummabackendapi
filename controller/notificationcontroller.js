// backend/controller/notificationcontroller.js
const User = require("../schema/Users");
const Imam = require("../schema/Admin");
const Notification = require("../schema/notification");
const { sendFCMNotification } = require("../firebase");

exports.sendcumanotification = async (req, res) => {
  try {
    const { senderId, title, body, mescidId } = req.body;

    console.log("[CumaNotification] Request body:", {
      senderId,
      title,
      body,
      mescidId,
    });

    if (!senderId || !title || !body || !mescidId) {
      console.warn("[CumaNotification] Eksik veri:", {
        senderId,
        title,
        body,
        mescidId,
      });
      return res.status(400).json({ error: "Eksik veri" });
    }

    // Gönderen imamı bul
    const sender = await Imam.findById(senderId).lean();
    if (!sender) {
      console.warn("[CumaNotification] Imam bulunamadı:", senderId);
      return res.status(404).json({ error: "Imam bulunamadı" });
    }

    console.log("[CumaNotification] Imam bulundu:", sender.name);

    // MescidId'ye bağlı kullanıcıları bul
    const users = await User.find({
      "cumemescidi.id": mescidId,
      fcmToken: { $exists: true, $ne: [] },
    })
      .select("_id fcmToken cumemescidi")
      .lean();

    console.log(`[CumaNotification] Kullanıcı sayısı: ${users.length}`);

    const tokens = users.flatMap((u) => u.fcmToken || []).filter(Boolean);

    if (!tokens.length) {
      console.warn("[CumaNotification] FCM token içeren kullanıcı bulunamadı.");
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    try {
      console.log(
        `[CumaNotification] FCM gönderimi başlatılıyor. Token sayısı: ${tokens.length}`
      );

      // FCM gönderimi
      const sendResult = await sendFCMNotification(tokens, title, body, {
        screen: "mainpage",
        mescidId: String(mescidId),
        senderId: String(senderId),
        senderName: sender.name,
        type: "cumaNotification",
      });

      console.log("[CumaNotification] FCM gönderim sonucu:", {
        successCount: sendResult.successCount,
        failureCount: sendResult.failureCount,
        invalidTokens: sendResult.invalidTokens?.length || 0,
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

      console.log(
        "[CumaNotification] Bildirim veritabanına kaydedildi:",
        saved._id
      );

      res.json({
        success: true,
        sentCount: sendResult.successCount || users.length,
        failureCount: sendResult.failureCount || 0,
        invalidTokens: (sendResult.invalidTokens || []).slice(0, 10),
        notificationId: saved._id,
      });
    } catch (sendErr) {
      console.error("[CumaNotification] FCM gönderim hatası:", sendErr);
      return res.status(500).json({ error: "Bildirim gönderilirken hata" });
    }
  } catch (err) {
    console.error("[CumaNotification] Genel sunucu hatası:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
