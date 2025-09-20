const axios = require("axios");
const User = require("../schema/Users");
const Imam = require("../schema/Admin");
const Notification = require("../schema/notification");

exports.sendcumanotification = async (req, res) => {
  try {
    const { senderId, title, body, mescidId, admin } = req.body;

    if (!senderId || !title || !body) {
      return res.status(400).json({ hata: "Eksik veri" });
    }

    const sender = await Imam.findById(senderId);
    if (!sender) {
      return res.status(404).json({ hata: "Imam tapılmadı" });
    }

    // Kullanıcıları filtrele
    if (!mescidId) {
      return res.status(400).json({ error: "mescidId eksik" });
    }

    console.log("user:", admin);
    console.log("user:", mescidId);

    const users = await User.find({
      "cumemescidi.id": mescidId,
      expoPushToken: { $ne: null },
    }).select("_id expoPushToken cumemescidi");

    users.map((user) => {
      console.log("userid", user.cumemescidi);
    });

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

    function chunkArray(array, size) {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    }

    const chunks = chunkArray(messages, 100);

    let exporesults = [];
    for (const chunk of chunks) {
      const response = await axios.post(
        "https://exp.host/--/api/v2/push/send",
        chunk,
        { headers: { "Content-Type": "application/json" } }
      );
      exporesults.push(response.data);
    }

    const exporesult = exporesults;
    // 5. Bildirimi DB’ye kaydet
    const notification = new Notification({
      announce: {
        title,
        body,
      },
      senderId: sender._id,
      senderRole: sender.role,
      senderName: `${sender.name} ${sender.surname}`,
      mescidId: mescidId || null,
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
