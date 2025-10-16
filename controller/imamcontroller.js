const Imam = require("../schema/İmam");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../schema/Users");
const Session = require("../schema/Session");

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "20m" } // Access token expires in 25 minutes
  );

  const refreshToken = jwt.sign(
    { userId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET, // Use separate secret if available
    { expiresIn: "15d" } // Refresh token expires in 7 days
  );

  return { accessToken, refreshToken };
};

exports.imamsignup = async (req, res) => {
  const { name, surname, email, seccode, password, role, phone, cins } =
    req.body;

  const user = await Imam.findOne({ email });

  if (user) {
    return res
      .status(400)
      .json({ hata: "Bu istifadəçi artıq mövcuddur, Giriş edin" });
  }

  const hashedpassword = await bcrypt.hash(password, 10);
  const hashedseccode = await bcrypt.hash(seccode, 10);

  const newuser = new Imam({
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
  const imam = await Imam.findOne({ email, role: "imam" });

  if (!imam) {
    return res.status(400).json({ hata: "İstifadəçi tapılmadı" });
  }

  const matchpass = await bcrypt.compare(password, imam.password);
  // const matchseccode = await bcrypt.compare(seccode, user.securitycode);

  if (!matchpass) {
    return res.status(400).json({ hata: "Şifrə yanlışdır" });
  }

  // access ve refresh token üret
  const { accessToken, refreshToken } = generateTokens(imam._id);

  // refresh token'ı DB’ye kaydet
  imam.refreshToken = refreshToken;
  await imam.save();

  return res.status(200).json({
    mesaj: "Uğurlu giriş",
    accessToken,
    refreshToken,
    user: {
      id: imam._id,
      phone: imam.phone,
      email: imam.email,
      role: imam.role,
      surname: imam.surname,
      name: imam.name,
      cins: imam.cins,
      mescid: imam.mescid,
    },
  });
};

exports.imamloginweb = async (req, res) => {
  const { email, password } = req.body;
  const imam = await Imam.findOne({ email, role: "imam" });

  if (!imam) {
    return res.status(400).json({ hata: "İstifadəçi tapılmadı" });
  }

  const matchpass = await bcrypt.compare(password, imam.password);
  // const matchseccode = await bcrypt.compare(seccode, user.securitycode);

  if (!matchpass) {
    return res.status(400).json({ hata: "Şifrə yanlışdır" });
  }

  // access ve refresh token üret
  const { accessToken, refreshToken } = generateTokens(imam._id);

  // refresh token'ı DB’ye kaydet

  await Session.create({
    userId: imam._id,
    userType: "Imam",
    refreshToken,
    device: "web",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 24 * 60 * 60 * 1000,
  });
  console.log("role:", imam.role);

  return res.status(200).json({
    mesaj: "Uğurlu giriş",
    accessToken,
    user: {
      id: imam._id,
      phone: imam.phone,
      email: imam.email,
      role: imam.role,
      surname: imam.surname,
      name: imam.name,
      cins: imam.cins,
      mescid: imam.mescid,
    },
  });
};

exports.verifyimam = async (req, res) => {
  try {
    const userId = req.ImamId;
    console.log("imamid:", userId);
    if (!userId) {
      console.log("❌ [getImam] ImamId bulunamadı");
      return res.status(401).json({
        success: false,
        message: "Yetkilendirme hatası: ImamId bulunamadı",
      });
    }

    console.log("🔍 [getImam] Searching for Imam with ID:");

    // Şifre, doğrulama kodu ve diğer hassas alanları hariç tut
    const hiddenFields = "-password -__v";
    const user = await Imam.findById(userId).select(hiddenFields);

    if (!user) {
      console.log("❌ [getImam] Imam not found for ID:");
      return res.status(404).json({
        success: false,
        message: "Imam bulunamadı",
      });
    }

    // console.log("✅ [getMe] User found:", {
    //   id: user._id,
    //   fullname: user.fullname,
    //   email: user.email,
    //   role: user.role
    // });

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ [getImam] Imam bilgisi alınırken hata:", error);

    return res.status(500).json({
      success: false,
      message: "Sunucu hatası oluştu",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.changeImamPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const imam = await Imam.findById(req.ImamId);

    if (!imam) {
      return res.status(404).json({ hata: "İmam hesabı tapılmadı" });
    }

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

    if (newPassword === currentPassword) {
      return res.status(400).json({
        hata: "Köhnə şifrəni istifadə edə bilməzsinizçyeni şifrə təyin edin",
      });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    imam.password = hashedNew;
    await imam.save();

    return res
      .status(200)
      .json({ mesaj: "Şifrə uğurla dəyişdirildi", success: true });
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
    const admin = await Imam.findById(decoded.userId);
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

exports.refreshTokenweb = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ hata: "Refresh token yoxdur" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const session = await Session.findOne({
      userId: decoded.userId,
      refreshToken: token,
    });

    if (!session) {
      return res
        .status(403)
        .json({ hata: "Session tapılmadı və ya token keçərsiz" });
    }

    // Token geçerli → yeni access + refresh token üret
    const { accessToken, refreshToken } = generateTokens(decoded.userId);

    // Session güncelle
    session.refreshToken = refreshToken;
    session.expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    await session.save();

    // Cookie yenile
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res
      .status(403)
      .json({ hata: "Refresh token etibarsız və ya vaxtı keçib" });
  }
};

exports.logout = async (req, res) => {
  try {
    const { email, token } = req.body;
    const imam = await Imam.findOne({ email });
    if (!imam) return res.status(404).json({ hata: "İmam tapılmadı" });

    // Mobil sistem için:
    imam.refreshToken = null;
    await imam.save();

    // Web logout ise sadece ilgili session sil
    if (token) {
      await Session.deleteOne({ refreshToken: token });
    }

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
    const imam = await Imam.findById(id);
    if (!imam) {
      return res.status(404).json({ hata: "Imam hesabi movcud deyil" });
    }
    const updatedImam = await Imam.findByIdAndUpdate(
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
  const user = await Imam.findOne({ email });

  if (!user) {
    return res.status(400).json({ hata: "İstifadəçi tapılmadı" });
  }

  return res.status(200).json({ mesaj: "Uğurlu", user });
};

exports.getadmins = async (req, res) => {
  try {
    const admins = await Imam.find({ role: "admin" }); // sadece adminler

    res.status(200).json({ success: true, users: admins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getimams = async (req, res) => {
  try {
    const imams = await Imam.find({ role: "imam" }); // sadece adminler

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
    const mescids = await Imam.find({ role: "imam" });

    return res.status(200).json({ mesaj: "Good request", mescids });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ hata: "Server error" });
  }
};
