const { default: mongoose, mongo } = require("mongoose");

const ianeschema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    basliq: { type: String, required: true },
    movzu: { type: String, required: true },
    yigilanmebleg: Number,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    state: {
      type: String,
      enum:['completed','continue']
    }
  },
  {
    timestamps: true,
  }
);

const imamianeschema = new mongoose.Schema(
  {
    imamname: String,
    imamsurname: String,
    mescid: String,
    role: String,
    email: String,
    ianeler: [ianeschema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Iane", imamianeschema);
