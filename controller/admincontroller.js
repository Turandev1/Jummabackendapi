const Admin = require("../schema/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Iane = require("../schema/Iane");

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

exports.signupadmin = async (req, res) => {
  try {
    const { name, surname, username, email, password } = req.body;

    if (!name || !surname || !username || !email || !password) {
      console.log("bilgiler eskikdir");
      return res.status(404).json({ hata: "Butun saheleri doldurun" });
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    const newadmin = new Admin({
      name,
      surname,
      username,
      email,
      password: hashedpassword,
      role: "admin",
    });

    return res
      .status(201)
      .json({ message: "Admin ugurla qeyd edildi", newadmin, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ hata: "Server xetasi", error });
  }
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

exports.editadmin = async (req, res) => {
  try {
    const { name, surname, email, username, id } = req.body;
    const admin = await Admin.findById(id);
    if (!admin) {
      console.log("Admin tapılmadı");
      return res.status(404).json({ hata: "Admin tapılmadı", success: false });
    }

    admin.name = name;
    admin.surname = surname;
    admin.username = username;
    admin.email = email;

    await admin.save();

    return res
      .status(200)
      .json({ success: true, message: "Ugurla deyisdi", admin });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ hata: "Server xetasi", success: false, error });
  }
};

exports.getianeler = async (req, res) => {
  try {
    const imams = await Iane.find();

    res.status(200).json({ success: true, imams });
  } catch (error) {
    console.error(error);
  }
};

exports.markasread = async (req, res) => {
  try {
    const { id } = req.params;

    const iane = await Iane.findById(id);
    iane.isread = true;
    await iane.save();

    res
      .status(200)
      .json({ success: true, message: "İane okundu olarak işaretlendi" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

exports.markasunread = async (req, res) => {
  try {
    const { id } = req.params;

    const iane = await Iane.findById(id);
    iane.isread = false;
    iane.save();

    res
      .status(200)
      .json({ success: true, message: "İane okundu olarak işaretlendi" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

exports.approveiane = async (req, res) => {
  try {
    const { id } = req.params;

    const iane = await Iane.findById(id);
    iane.status = "approved";
    iane.approved = true;

    await iane.save();
    res.json({ success: true, message: "İane onaylandı" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectiane = async (req, res) => {
  try {
    const { id } = req.params;

    const iane = await Iane.findById(id);
    iane.status = "rejected";
    iane.approved = false;

    await iane.save();
    res.json({ success: true, message: "İane onaylandı" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
