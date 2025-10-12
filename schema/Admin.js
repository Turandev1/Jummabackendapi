const { default: mongoose } = require("mongoose");

const adminschema = new mongoose.Schema(
  {
    name: String,
    surname: String,
    email: String,
    password: String,
    refreshToken: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminschema, "adminler");
