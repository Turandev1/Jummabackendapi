const axios = require("axios");
const User = require("../schema/Users");
const Imam = require("../schema/Admin");
const Notification = require("../schema/notification");

exports.sendcumanotification = async (req, res) => {
  try {
    const { senderId, title, body, adminId, userr } = req.body;

    if (!senderId || !title || !body) {
      return res.status(400).json({ hata: "Eksik veri" });
    }

    const sender = await Imam.findById(senderId);
    if (!sender) {
      return res.status(404).json({ hata: "Imam tapılmadı" });
    }

    // Kullanıcıları filtrele
    if (!adminId) {
      return res.status(400).json({ error: "adminId eksik" });
    }
    console.log("user:", userr);
    const users = await User.find({
      "cumemescidi.id": adminId,
      expoPushToken: { $ne: null },
    }).select("_id expoPushToken cumemescidi");

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
      mescidId: adminId || null,
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
    console.error("sendcumanotification error:", err);
    console.log("sendcumanotification error:", err);
    console.error("sendcumanotification error:", err.message, err.stack);
    console.log("sendcumanotification error:", err.message, err.stack);
    // Only log adminId if it exists in req.body
    console.log(
      "admin:",
      req.body && req.body.adminId ? req.body.adminId : "undefined"
    );

    return res.status(500).json({ error: "Sunucu hatası" });
  }
};
