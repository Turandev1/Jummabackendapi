const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true }, // Kullanıcının adı
    title: { type: String, required: true, maxlength: 40 }, // Başlık
    message: { type: String, required: true, maxlength: 3000 }, // Mesaj
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Opsiyonel: giriş yapmış kullanıcıdan gelsin diye
    reply: { type: String, default: "" }, // Adminin cevabı
    status: {
      type: String,
      enum: ["pending", "answered"], // admin cevapladı mı?
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
