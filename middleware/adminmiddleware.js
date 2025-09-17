const Admin = require("../schema/Admin");
const jwt = require("jsonwebtoken");

const adminmiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"]; 
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ hata: "Token yoxdur,giris edin" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.userId || decoded.id);
    if (!admin) {
      return res.status(401).json({ hata: "kecersiz token" });
    }
    req.admin = admin;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(403).json({ hata: "Token doğrulanmadı" });
  }
};


module.exports=adminmiddleware