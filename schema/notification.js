// File: backend/schema/Notification.js
const mongoose = require("mongoose");





const announceschema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  publishedAt: { type: Date, default: Date.now },
});




const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["announcement", "message", "alert"],
      required: true,
      default: "message",
    },
    title: { type: String },
    body: { type: String},

    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ["admin", "imam"], required: true },
    senderName: { type: String, required: true },
    mescidId: { type: Number }, // imamın camisi

    sentTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sentCount: { type: Number, default: 0 },

    announce: announceschema,
    
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexler
notificationSchema.index({ senderRole: 1, mescid: 1 });
notificationSchema.index({ sentTo: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
