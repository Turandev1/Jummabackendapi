const axios = require("axios");
const User = require("../schema/Users");
const Imam = require("../schema/Admin");
const Notification = require("../schema/notification");

async function sendExpoPushNotifications(messages) {
  if (!messages.length) return;

  const chunkSize = 100;
  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    try {
      const response = await axios.post(
        "https://exp.host/--/api/v2/push/send",
        chunk,
        {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      // DeviceNotRegistered -> DB’den token sil
      if (response.data?.data) {
        response.data.data.forEach(async (r, idx) => {
          if (
            r.status === "error" &&
            r.details?.error === "DeviceNotRegistered"
          ) {
            const badToken = chunk[idx].to;
            await User.updateOne(
              { expoPushToken: badToken },
              { $unset: { expoPushToken: "" } }
            );
          }
        });
      }
    } catch (err) {
      console.error("Expo push error:", err.response?.data || err.message);
    }
  }
}

exports.sendNotificationToAll = async (req, res) => {
  try {
    const { mesaj, title = "Genel Bildiri" } = req.body;
    const adminId = req.userId;

    if (!mesaj)
      return res.status(400).json({ success: false, message: "Mesaj gerekli" });

    // Tüm verified kullanıcıları bul
    const usersWithTokens = await User.find({
      expoPushToken: { $ne: null },
    }).select("expoPushToken _id");
    const tokens = usersWithTokens.map((u) => u.expoPushToken);

    if (!tokens.length) {
      return res.json({ success: true, message: "Gönderilecek token yok" });
    }

    // Notification DB kaydı
    const notification = new Notification({
      title,
      body: mesaj,
      senderId: adminId,
      senderRole: "admin",
      senderName: req.userName,
      sentTo: usersWithTokens.map((u) => u._id),
      status: "sent",
      sentCount: tokens.length,
    });
    await notification.save();

    // Push mesajları
    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body: mesaj,
      data: { origin: "admin-broadcast" },
    }));

    await sendExpoPushNotifications(messages);

    return res.json({
      success: true,
      message: "Bildirimler gönderildi",
      sent: tokens.length,
    });
  } catch (err) {
    console.error("sendNotificationToAll error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

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
    const users = await User.find({
      "cumemescidi.id":mescid.id,
      expoPushToken: { $ne: null }, // expo token olanlar
    }).select("_id expoPushToken cumemescidi");


    console.log('users:',users)

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
    console.log("mescid:", mescid.id);
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
