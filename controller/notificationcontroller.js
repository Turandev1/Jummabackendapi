const axios = require("axios");
const User = require("../schema/Users");
const Imam = require("../schema/Admin");
const Notification = require("../schema/notification");

exports.sendcumanotification = async (req, res) => {
  try {
    const { senderId, title, body, mescid } = req.body;

    if (!senderId || !title || !body) {
      return res.status(400).json({ hata: "Eksik veri" });
    }

    const sender = await Imam.findById(senderId);
    if (!sender) {
      return res.status(404).json({ hata: "Imam tapılmadı" });
    }

    // Kullanıcıları filtrele
    const mescidObj = Array.isArray(mescid) ? mescid[0] : mescid;

    const users = await User.find({
      $or: [{ "cumemescidi.id": Number(mescidObj.id) }],
      expoPushToken: { $ne: null },
    }).select("_id expoPushToken cumemescidi");

    console.log("mescid:", mescid);
    console.log("type:", typeof mescid[0].id);
    console.log("users:", users);

    if (!users.length) {
      return res.status(404).json({ error: "Kayıtlı kullanici bulunamadi" });
    }

    const messages = users.map((u) => ({
      to: u.expoPushToken,
      sound: "default",
      title,
      body,
      data: { userId: u._id.toString(), type: "announcement" },
    }));

    const exporesponse = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      messages, // doğrudan array
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const exporesult = exporesponse.data;
    // 5. Bildirimi DB’ye kaydet
    const notification = new Notification({
      announce: {
        title,
        body,
      },
      senderId: sender._id,
      senderRole: sender.role,
      senderName: `${sender.name} ${sender.surname}`,
      mescidId: mescid.id || null,
      sentTo: users.map((u) => u._id),
      sentCount: users.length,
      status: "sent",
    });

    await notification.save();

    return res.json({
      success: true,
      sentCount: users.length,
      exporesult,
      notificationId: notification._id,
    });
  } catch (err) {
    console.error("sendNotificationToAll error:", err);
    console.error("sendNotificationToAll error:", err.message, err.stack);

    return res.status(500).json({ error: "Sunucu hatası" });
  }
};
