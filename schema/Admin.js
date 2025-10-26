const { default: mongoose } = require("mongoose");

const adminschema = new mongoose.Schema(
  {
    name: String,
    surname: String,
    username:String,
    email: String,
    role:String,
    password: String,
    refreshToken: String,
  },
  {
    timestamps: true,
  }
);







module.exports = mongoose.model("Admin", adminschema, "adminler");
