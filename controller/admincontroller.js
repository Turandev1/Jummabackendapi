const Admin = require("../schema/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../schema/Users");


// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "25m" } // Access token expires in 25 minutes
  );

  const refreshToken = jwt.sign(
    { userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET, // Use separate secret if available
    { expiresIn: "15d" } // Refresh token expires in 7 days
  );

  return { accessToken, refreshToken };
};

exports.imamsignup = async (req, res) => {
  const {
    name,
    surname,
    email,
    seccode,
    password,
    confirmpassword,
    role,
    phone,
    cins,
  } = req.body;

  if (
    !name ||
    !surname ||
    !email ||
    !seccode ||
    !password ||
    !confirmpassword ||
    !phone
  ) {
    return res.status(400).json({ hata: "Bütün məcburi sahələri doldurun" });
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ hata: "Parollar uyğun deyil" });
  }

  const user = await Admin.findOne({ email });

  if (user) {
    return res
      .status(400)
      .json({ hata: "Bu istifadəçi artıq mövcuddur, Giriş edin" });
  }

  const hashedpassword = await bcrypt.hash(password, 10);
  const hashedseccode = await bcrypt.hash(seccode, 10);

  const newuser = new Admin({
    name,
    surname,
    password: hashedpassword,
    securitycode: hashedseccode,
    role,
    phone,
    email,
    cins,
  });

  await newuser.save();

  return res.status(201).json({ mesaj: "Qeydiyyat ugurludur" });
};

exports.imamlogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await Admin.findOne({ email, role: "imam" });

  if (!user) {
    return res.status(400).json({ hata: "İstifadəçi tapılmadı" });
  }

  const matchpass = await bcrypt.compare(password, user.password);
  // const matchseccode = await bcrypt.compare(seccode, user.securitycode);

  if (!matchpass) {
    return res.status(400).json({ hata: "Şifrə yanlışdır" });
  }

  // access ve refresh token üret
  const { accessToken, refreshToken } = generateTokens(user._id);

  // refresh token'ı DB’ye kaydet
  user.refreshToken = refreshToken;
  await user.save();

  return res.status(200).json({
    mesaj: "Uğurlu giriş",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      surname: user.surname,
      name: user.name,
      cins: user.cins,
      mescid: user.mescid,
    },
  });
};


exports.verifyImamToken = async (req, res) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({ hata: "Token yoxdur" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.userId || decoded.id);
    if (!admin) {
      return res.status(401).json({ hata: "İstifadəçi tapılmadı" });
    }

    return res.status(200).json({ mesaj: "Token keçərlidir", user: admin });
  } catch (err) {
    console.error("Token doğrulama xətası:", err);
    return res.status(403).json({ hata: "Token etibarsız və ya vaxtı keçib" });
  }
};

exports.changeImamPassword = async (req, res) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
      return res.status(401).json({ hata: "Token yoxdur" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const imam = await Admin.findById(decoded.userId);

    if (!imam) {
      return res.status(404).json({ hata: "İmam hesabı tapılmadı" });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ hata: "Bütün sahələri doldurun" });
    }

    const match = await bcrypt.compare(currentPassword, imam.password);
    if (!match) {
      return res.status(400).json({ hata: "Cari şifrə yanlışdır" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ hata: "Yeni şifrələr uyğun deyil" });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    imam.password = hashedNew;
    await imam.save();

    return res.status(200).json({ mesaj: "Şifrə uğurla dəyişdirildi" });
  } catch (error) {
    console.error("Şifrə dəyişmə xətası:", error);
    return res.status(500).json({ hata: "Server xətası" });
  }
};




exports.refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ hata: "Refresh token yoxdur" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.userId);
    if (!admin || admin.refreshToken !== token) {
      return res.status(403).json({ hata: "Refresh token etibarsızdır" });
    }

    const { accessToken, refreshToken } = generateTokens(admin._id);

    admin.refreshToken = refreshToken;
    await admin.save();

    return res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res
      .status(403)
      .json({ hata: "Refresh token etibarsız və ya vaxtı keçib" });
  }
};


exports.logout = async (req, res) => {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(400).json({ hata: "Token yoxdur" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.userId);
    if (!admin) {
      return res.status(404).json({ hata: "İstifadəçi tapılmadı" });
    }

    // refresh token'ı sıfırla
    admin.refreshToken = null;
    await admin.save();

    return res.status(200).json({ mesaj: "Çıxış uğurlu" });
  } catch (err) {
    console.error("Logout error:", err);
    return res
      .status(403)
      .json({ hata: "Token etibarsız və ya artıq istifadə olunub" });
  }
};



exports.editimamacc = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, surname, email, role, mescid } = req.body;
    const imam = await Admin.findById(id);
    if (!imam) {
      return res.status(404).json({ hata: "Imam hesabi movcud deyil" });
    }
    const updatedImam = await Admin.findByIdAndUpdate(
      id,
      {
        name,
        surname,
        email,
        role,
        mescid: {
          name: mescid?.name,
          location: mescid?.location,
          latitude: mescid?.latitude,
          longitude: mescid?.longitude,
        },
      },
      { new: true }
    );
    if (!updatedImam) {
      return res.status(404).json({ message: "İmam bulunamadı" });
    }
    res.status(200).json({ message: "İmam güncellendi", user: updatedImam });
  } catch (error) {
    console.error("İmam güncellenirken hata:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

exports.getme = async (req, res) => {
  const { email } = req.query;
  const user = await Admin.findOne({ email });

  if (!user) {
    return res.status(400).json({ hata: "İstifadəçi tapılmadı" });
  }

  return res.status(200).json({ mesaj: "Uğurlu", user });
};

exports.getadmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: "admin" }); // sadece adminler

    res.status(200).json({ success: true, users: admins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getimams = async (req, res) => {
  try {
    const imams = await Admin.find({ role: "imam" }); // sadece adminler

    res.status(200).json({ success: true, users: imams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/users
exports.getusers = async (req, res) => {
  try {
    const users = await User.find(); // tüm kullanıcılar
    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getmescids = async (req, res) => {
  try {
    const mescids = await Admin.find({ role: "imam" });


    return res.status(200).json({ mesaj: "Good request",mescids });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ hata: "Server error" });
  }
};

