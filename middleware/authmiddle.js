// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ [AuthMiddleware] No authorization header or invalid format");
    return res.status(401).json({ hata: "Yetkilendirme reddedildi" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ [AuthMiddleware] Token decoded successfully, userId:");
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.log("❌ [AuthMiddleware] Token verification failed:", err.message);
    return res.status(401).json({ hata: "Geçersiz token" });
  }
};

module.exports = authMiddleware;
