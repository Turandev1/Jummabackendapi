const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables
const cors = require("cors");
const path = require("path");
require("./ping");

const authRoutes = require("./routes/authroutes");
const approutes = require("./routes/mainroutes");

app.use(
  cors({
    origin: "*", // Her yerden isteklere izin ver
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"], // İzin verilen HTTP metotları
  })
);

if (!process.env.MONGO_URI) {
  console.error("Hata: MONGO_URI ortam değişkeni tanımlı değil.");
  process.exit(1); // Uygulamadan çık
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bağlantısı başarılı."))
  .catch((err) => {
    console.error("Veritabanı bağlantı hatası:", err);
    process.exit(1); // Bağlantı hatasında uygulamadan çık
  });

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/app", approutes);

const PORT = process.env.PORT;

app.listen(PORT);
