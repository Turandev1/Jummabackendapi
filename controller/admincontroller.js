const Admin = require("../schema/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "25m",
  });

  const refreshToken = jwt.sign(
    { userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "15d" }
  );

  return { accessToken, refreshToken };
};

exports.adminlogin = async (req, res) => {
  const { email, password } = req.body;

  console.log("email", email);
  console.log("pass", password);

  try {
    const user = await Admin.findOne({ email });
    console.log("user:", user);
    if (!user) {
      console.log("user yoxdur");
      return res.status(404).json({ success: false, hata: "Admin tapılmadı" });
    }

    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) {
      return res.status(400).json({ hata: "Şifrə səhvdir" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res
      .status(200)
      .json({ mesaj: "Giriş ugurludur", success: true, accessToken, user });
  } catch (error) {
    console.error(error);
  }
};

exports.refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ hata: "Refresh token yoxdur" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await Admin.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ hata: "Token etibarsızdır" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(403).json({ hata: "Refresh token yanlışdır" });
  }
};

exports.adminlogout = async (req, res) => {
  const AdminId = req.ImamId;
  try {
    const user = await Admin.findById(AdminId);
    user.refreshToken = null;
    await user.save();

    return res.status(200).json({ mesaj: "Çıxış ugurludur", success: true });
  } catch (error) {
    console.error(error);
  }
};
