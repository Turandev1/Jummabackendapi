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

    const sender = await Imam.findById(senderId);
    if (!sender) return res.status(404).json({ error: "Imam bulunamadı" });

    const users = await User.find({
      "cumemescidi.id": mescidId,
      fcmToken: { $exists: true, $ne: [] },
    }).select("_id fcmToken cumemescidi");

    const tokens = users.flatMap((u) => u.fcmToken).filter(Boolean);
    if (!tokens.length) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // 🔹 Bildirim gönder
    await sendFCMNotification(tokens, title, body, {
      screen: "MainPage",
      mescidId: String(mescidId),
      senderId: String(senderId),
      senderName: sender.name,
      type: "cumaNotification",
    });

    // 🔹 DB’ye kaydet
    const notification = new Notification({
      title,
      body,
      senderId: sender._id,
      senderRole: sender.role,
      senderName: `${sender.name} ${sender.surname}`,
      mescidId,
      sentTo: users.map((u) => u._id),
      sentCount: users.length,
      status: "sent",
      data: {
        screen: "MainPage",
        params: { mescidId, senderName: sender.name },
        customKey: "cumaNotification",
      },
    });

    await notification.save();

    res.json({
      success: true,
      sentCount: users.length,
      notificationId: notification._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
