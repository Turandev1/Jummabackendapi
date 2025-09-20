// File: backend/schema/Notification.js
const mongoose = require("mongoose");



const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["announcement", "message", "alert"], default: "announcement" },
  title: { type: String, required: true },
  body: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, enum: ["admin", "imam"], required: true },
  senderName: { type: String, required: true },
  mescidId: { type: Number },
  sentTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  sentCount: { type: Number, default: 0 },
  readBy: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, readAt: { type: Date, default: Date.now } }],
  status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
}, { timestamps: true });

// Fix index
notificationSchema.index({ senderRole: 1, mescidId: 1 }); // Fixed: mescidId not mescid

module.exports = mongoose.model("Notification", notificationSchema);
