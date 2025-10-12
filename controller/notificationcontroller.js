const User = require("../schema/Users");
const Imam = require("../schema/İmam");
const Notification = require("../schema/notification");
const { sendFCMNotification } = require("../firebase");

exports.sendcumanotification = async (req, res) => {
  try {
    const { senderId, title, body, mescidId, time } = req.body;
    console.log('senderId:', senderId)
    console.log('title:', title)
    console.log('body:', body)
    console.log('mescidId:', mescidId)
    console.log('time:', time)
    if (!senderId || !title || !body || !mescidId) {
      return res.status(400).json({ error: "Eksik veri" });
    }

    // Imam bul
    const sender = await Imam.findById(senderId).lean();
    if (!sender) {
      return res.status(404).json({ error: "Imam bulunamadı" });
    }

    // Mescid kullanıcılarını bul
    const users = await User.find({
      "cumemescidi.id": mescidId,
      fcmToken: { $exists: true, $ne: [] },
    })
      .select("_id fcmToken cumemescidi")
      .lean();

    const tokens = users.flatMap((u) => u.fcmToken || []).filter(Boolean);
    if (!tokens.length) {
      return res.status(404).json({ error: "İstifadəçi tapılmadı" });
    }

    // FCM gönderimi
    const sendResult = await sendFCMNotification(tokens, title, body, {
      screen: "mainpage",
      mescidId: String(mescidId),
      senderId: String(senderId),
      senderName: sender.name,
      type: "cumaNotification",
    });

    const cumabildirimiData = {
      title,
      body,
      mescidId,
      sentTo: users.map((u) => u._id),
      sentCount: sendResult.successCount || users.length,
      failureCount: sendResult.failureCount || 0,
      invalidTokens: sendResult.invalidTokens || [],
      status: "sent",
      time: new Date(Date.now() + time * 60 * 1000),
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
    };

    // İmam için mevcut Notification kaydını kontrol et
    let imamNotification = await Notification.findOne({ senderId: sender._id });

    if (imamNotification) {
      // 🔄 Var ise cumabildirimi alanını güncelle
      imamNotification.cumabildirimi = cumabildirimiData;
      await imamNotification.save();

      console.log("[CumaNotification] Güncellendi:", imamNotification._id);
    } else {
      // 🆕 Yoksa yeni bir kayıt oluştur
      imamNotification = new Notification({
        senderId: sender._id,
        senderRole: sender.role,
        senderName: `${sender.name} ${sender.surname || ""}`.trim(),
        cumabildirimi: cumabildirimiData,
      });
      await imamNotification.save();

      console.log(
        "[CumaNotification] Yeni imam bildirimi oluşturuldu:",
        imamNotification._id
      );
    }

    _io.emit("newCumaNotification", { mescidId, title, body });

    res.json({
      success: true,
      sentCount: cumabildirimiData.sentCount,
      failureCount: cumabildirimiData.failureCount,
      invalidTokens: (sendResult.invalidTokens || []).slice(0, 10),
      notificationId: imamNotification._id,
    });
  } catch (err) {
    console.error("[CumaNotification] Genel hata:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

exports.getLatestNotification = async (req, res) => {
  const { mescidId } = req.params;
  try {
    const latest = await Notification.findOne({ mescidId })
      .sort({ createdAt: -1 })
      .lean();
    if (!latest) return res.json({ message: "No notification yet" });
    res.json(latest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
