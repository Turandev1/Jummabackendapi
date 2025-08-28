const mongoose = require("mongoose");

const userschema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cins: {
      type: String,
      enum: ["male", "female"],
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "seller", "imam"],
      default: "user",
    },
    privilige: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\+?[0-9]{10,15}$/, "Geçerli bir telefon numarası giriniz"],
    },
    isverified: {
      type: Boolean,
      default: false,
    },
    verificationcode: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userschema);
