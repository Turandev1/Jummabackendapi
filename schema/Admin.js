const mongoose = require("mongoose");

const mescidschema = new mongoose.Schema({
  id: Number,
  city: String,
  country: String,
  name: String,
  location: String,
  latitude: Number,
  longitude: Number, //boylam,
});

const adminschema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    mescid: mescidschema,
    cins: { type: String, enum: ["male", "female"], default: null },
    role: {
      type: String,
      enum: ["imam", "admin", "supervisor"],
      required: true,
    },
    verificationcode: String,
    refreshToken: String,
    securitycode: { type: String, required: true },
    permissions: {
      type: String,
      enum: [
        "change_roles",
        "create_acc_imam",
        "create_acc_seller",
        "create_acc_admin",
        "delete_user_account",
        "delete_imam_account",
        "delete_admin_account",
        "get_user_accounts",
        "get_imam_accounts",
        "get_admin_accounts",
        "get_seller_accounts",
        "mal_sil",
        "mal_elaveet",
      ],
    },
  },
  {
    timestamps: true,
  }
);

// File: backend/schema/Admin.js
adminschema.index({ email: 1 });
adminschema.index({ role: 1 });
adminschema.index({ "mescid.name": 1 });

module.exports = mongoose.model("Admin", adminschema);
