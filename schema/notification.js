const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Bildirim başlığı ve içeriği (FCM notification objesi)
    title: { type: String, required: true },
    body: { type: String, required: true },

    // Gönderen bilgisi
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ["admin", "imam"], required: true },
    senderName: { type: String, required: true },

    // Hedef kullanıcılar (userId array)
    sentTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Gönderim durumu
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    sentCount: { type: Number, default: 0 },

    // Okuma durumu
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date }, // Kullanıcı okuduğunda set edilecek
      },
    ],

    // Optional: mescid veya özel grup
    mescidId: { type: Number },

    // Data payload (FCM data objesi)
    data: {
      screen: { type: String }, // navigate edilecek ekran
      params: { type: mongoose.Schema.Types.Mixed }, // arbitrary params
      customKey: { type: String }, // özel data key
    },

    // Bildirim sesi ve öncelik (Opsiyonel)
    priority: { type: String, enum: ["normal", "high"], default: "normal" },
    sound: { type: String, default: "default" },
    // Bildirim tipi: message, announcement, alert
    type: {
      type: String,
      enum: ["announcement", "message", "alert"],
      default: "announcement",
    },
  },
  { timestamps: true }
);

// Indexlemeler
notificationSchema.index({ senderRole: 1, mescidId: 1, status: 1 });
notificationSchema.index({ sentTo: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
