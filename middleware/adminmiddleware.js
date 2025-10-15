const Admin = require("../schema/İmam");
const jwt = require("jsonwebtoken");

const adminmiddleware = async (req, res, next) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  console.log("---- ADMIN MIDDLEWARE LOG ----");
  console.log("Zaman:", new Date().toISOString());
  console.log("İstek:", `${req.method} ${req.originalUrl}`);
  console.log(
    "Authorization Header:",
    authHeader ? authHeader.slice(0, 50) + "..." : "YOK"
  );

  if (!token) {
    console.warn("❌ Token eksik! Kullanıcı giriş yapmamış olabilir.");
    return res.status(401).json({ hata: "Token yoxdur, giris edin" });
  }

  console.log("✅ Token alındı. Doğrulama başlatılıyor...");

  try {
    // Token doğrulama
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 Token decode edildi:", decoded);

    // decoded içinde beklenen alan var mı
    if (!decoded.userId && !decoded.id) {
      console.warn("⚠️ Token içinde userId veya id alanı bulunamadı!");
      return res.status(401).json({ hata: "Token geçersiz formatta" });
    }

    // Admin kontrolü
    const adminId = decoded.userId || decoded.id;
    console.log("👤 Admin ID:", adminId);

    const imam = await Admin.findById(adminId);
    if (!imam) {
      console.warn(`🚫 Admin bulunamadı. ID: ${adminId}`);
      return res.status(401).json({ hata: "Kecersiz token" });
    }

    console.log(
      `✅ Admin doğrulandı: ${imam.name || imam.surname || imam.email}`
    );
    req.admin = imam;
    req.ImamId=adminId
    next();
  } catch (err) {
    console.error("❌ Token doğrulama hatası:", err.message);

    // Hata türüne göre detaylı açıklama
    if (err.name === "TokenExpiredError") {
      console.error("⏰ Token süresi dolmuş:", err.expiredAt);
      return res
        .status(403)
        .json({ hata: "Tokenin vaxti bitib, yeniden giris edin" });
    } else if (err.name === "JsonWebTokenError") {
      console.error("⚠️ JWT hatası: Geçersiz token");
      return res.status(403).json({ hata: "Kecersiz token" });
    } else {
      console.error("⚠️ Bilinmeyen hata:", err);
      return res
        .status(500)
        .json({ hata: "Server xətası: Token doğrulanmadı" });
    }
  }

  console.log("----------------------------------\n");
};

module.exports = adminmiddleware;
