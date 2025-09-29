const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("./ping");
const { validateEnvironment } = require("./config/environment");
const { generalLimiter } = require("./middleware/ratelimiter");
validateEnvironment();
const authRoutes = require("./routes/authroutes");
const approutes = require("./routes/mainroutes");
const adminroutes = require("./routes/adminroute");
const errorhandler = require("./middleware/errorhandler");
const notificationroutes = require("./routes/notificationroute");
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Yeni socket bağlandı:", socket.id);

  socket.on("joinRoom", (roomName) => {
    console.log(`Socket ${socket.id} joined room ${roomName}`);
    socket.join(roomName);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const allowedOrigins = [
  "http://localhost:3000", // Web dev
  "exp://192.168.1.68:8081", // Mobil dev (Expo)
  "https://jummabackend.com", // Production web
];

const corsOptions = {
  origin: function (origin, callback) {
    // Mobil uygulamalardan gelen isteklerde origin olmayabilir
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

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
// Rate limiter önce
app.use("/api/auth", generalLimiter, authRoutes);
app.use("/api/app", generalLimiter, approutes);
app.use("/api/notification", generalLimiter, notificationroutes);
app.use("/webapi/auth", adminroutes);

// Global error handler en sonda kalmalı
app.use(errorhandler);
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
