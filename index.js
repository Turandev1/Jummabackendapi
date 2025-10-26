const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
require("./ping");
const { validateEnvironment } = require("./config/environment");
const { generalLimiter } = require("./middleware/ratelimiter");
validateEnvironment();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const bodyparser = require("body-parser");

const cookieparser = require("cookie-parser");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

global._io = io;
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

const authRoutes = require("./routes/authroutes");
const approutes = require("./routes/mainroutes");
const imamroutes = require("./routes/imamroute");
const adminroutes = require("./routes/adminroute");
const notificationroutes = require("./routes/notificationroute");
const errorhandler = require("./middleware/errorhandler");

// ✅ CORS yapılandırması
const allowedOrigins = [
  "http://localhost:5173", // Local React web
  "https://yourdomain.vercel.app", // Production web
  "exp://192.168.1.68:8081", // Local Expo
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman veya mobil istekte origin yok
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ JSON parser
app.use(express.json());
app.use(cookieparser());
app.use(bodyparser.json());

// ✅ MongoDB bağlantısı
if (!process.env.MONGO_URI) {
  console.error("Hata: MONGO_URI ortam değişkeni tanımlı değil.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bağlantısı başarılı."))
  .catch((err) => {
    console.error("Veritabanı bağlantı hatası:", err);
    process.exit(1);
  });

// ✅ Rate limiter ve route’lar
app.use("/api/auth", generalLimiter, authRoutes);
app.use("/api/app", generalLimiter, approutes);
app.use("/api/notification", generalLimiter, notificationroutes);
app.use("/webapi/imam", imamroutes);
app.use("/webapi/admin", adminroutes);
// ✅ Hata yakalama
app.use(errorhandler);

// ✅ Proxy ayarı
app.set("trust proxy", 1);

// ✅ Server başlat
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
