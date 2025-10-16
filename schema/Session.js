const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "userType", // userType'e göre dinamik referans (Imam, Admin vs.)
  },
  userType: {
    type: String,
    required: true,
    enum: ["Imam", "Admin", "User"], // varsa diğer rollerini ekleyebilirsin
  },
  refreshToken: {
    type: String,
    required: true,
  },
  device: {
    type: String,
    default: "unknown", // "web", "mobile", "desktop"
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Session", sessionSchema);
