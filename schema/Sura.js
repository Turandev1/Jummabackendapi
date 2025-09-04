const mongoose = require("mongoose");

const ayahSchema = new mongoose.Schema({
  number: Number,
  text: String,
  numberInSurah: Number,
  juz: Number,
  manzil: Number,
  page: Number,
  ruku: Number,
  hizbQuarter: Number,
  sajda: Boolean,
});

const editionSchema = new mongoose.Schema({
  identifier: String,
  language: String,
  name: String,
  englishName: String,
  format: String,
  type: String,
  direction: String,
});

const suraSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  name: { type: String, required: true },
  englishName: String,
  englishNameTranslation: String,
  revelationType: String,
  numberOfAyahs: Number,
  ayahs: [ayahSchema],
  edition: editionSchema,
});

module.exports = mongoose.model("Sura", suraSchema);
