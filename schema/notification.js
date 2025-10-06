const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Gönderen imam bilgileri
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    senderRole: { type: String, enum: ["admin", "imam"], required: true },
    senderName: { type: String, required: true },

    // Cuma bildirimi (her imam için tek alan)
    cumabildirimi: {
      title: { type: String },
      body: { type: String },
      mescidId: { type: Number },
      sentTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      sentCount: { type: Number, default: 0 },
      failureCount: { type: Number, default: 0 },
      invalidTokens: [{ type: String }],
      startTime: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending",
      },
      time: { type: Date },
      data: {
        screen: { type: String },
        params: { type: mongoose.Schema.Types.Mixed },
        customKey: { type: String },
      },
      meta: {
        fcmRaw: { type: mongoose.Schema.Types.Mixed },
        invalidTokensCount: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ senderId: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
