const { default: mongoose, mongo } = require("mongoose");

const imamianeschema = new mongoose.Schema(
  {
    imamname: String,
    imamsurname: String,
    mescid: String,
    role: String,
    email: String,
    miqdar: { type: Number, required: true },
    basliq: { type: String, required: true },
    movzu: { type: String, required: true },
    yigilanmebleg: { type: Number, default: 0 },
    approved: { type: Boolean, default: false },
    isread: { type: Boolean, default: false },
    odenisler: [
      {
        id: String,
        miqdar: Number,
        description: String,
      },
    ],
    photos: [
      {
        name: String,
        url: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    state: {
      type: String,
      enum: ["completed", "continue"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Iane", imamianeschema);
