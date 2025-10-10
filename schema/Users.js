const mongoose = require("mongoose");

const messageschema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "read", "replied"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const userschema = new mongoose.Schema(
  {
    name: { type: String, default: null },
    surname: { type: String, default: null },
    email: { type: String, unique: true, sparse: true, default: null },
    password: { type: String, default: null },
    cins: { type: String, enum: ["male", "female"], default: null },
    cumemescidi: { type: Object },
    forgotpassverifycode: String,
    refreshToken: String,
    mesajlar: [messageschema],
    fcmToken: { type: [String], default: [] }, // burası düzeltildi
    notificationPreferences: {
      prayerReminders: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    lastNotificationRead: { type: Date, default: Date.now },
    isGuest: { type: Boolean, default: true },
    deviceInfo: {
      platform: String,
      version: String,
      lastSeen: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

// indeksler
userschema.index({ fcmToken: 1 });
userschema.index({ refreshToken: 1 });

module.exports = mongoose.model("User", userschema);
