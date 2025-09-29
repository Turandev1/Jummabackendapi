const User = require("../schema/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const logger = require("../utils/logger");
const sendMail = require("../utils/mailer");

// Helper: token üretimi
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

exports.signup = async (req, res) => {
  const { fullname, email, phone, password, confirmpassword } = req.body;

  if (!fullname || !email || !password || !confirmpassword)
    return res.status(400).json({
      success: false,
      message: "Bütün məcburi sahələr doldurulmalıdır",
    });

  if (password !== confirmpassword)
    return res
      .status(400)
      .json({ success: false, message: "Parollar uyğun deyil" });

  if (await User.findOne({ email }))
    return res
      .status(400)
      .json({ success: false, message: "Bu istifadəçi mövcuddur" });

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password))
    return res.status(400).json({ success: false, message: "Şifrə zəifdir" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = crypto.randomInt(100000, 999999).toString();

    const newUser = await User.create({
      fullname,
      email,
      phone,
      password: hashedPassword,
      isverified: false,
      verificationcode: verificationCode,
    });

    await sendMail(
      email,
      "Dogrulama kodu",
      `Doğrulama kodunuz: ${verificationCode}``<h2>Salam ${fullname}</h2>
       <p>Yeni doğrulama kodunuz: <b>${verificationCode}</b></p>`
    );

    return res.status(201).json({
      success: true,
      message: "Qeydiyyat uğurla tamamlandı. Email kodunu daxil edin",
      data: {
        email: newUser.email,
        fullname: newUser.fullname,
        phone: newUser.phone,
      },
    });
  } catch (err) {
    console.log("Signup server hatası:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server xətası baş verdi" });
  }
};

exports.verifyemail = async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ hata: "İstifadəçi tapılmadı" });
  }

  if (user.isverified) {
    return res.status(400).json({ hata: "İstifadəçi doğrulanıb,giriş edin" });
  }

  if (user.verificationcode === code) {
    user.isverified = true;
    user.verificationcode = null;
    await user.save();

    return res.status(200).json({ message: "Doğrulama uğurla tamamlandı" });
  } else {
    return res.status(400).json({ hata: "Kod yanlışdır" });
  }
};

// Kullanıcıya tekrar doğrulama kodu gönderme
exports.resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ hata: "Email verilməlidir" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ hata: "İstifadəçi tapılmadı" });
  }

  if (user.isverified) {
    return res.status(400).json({ hata: "İstifadəçi artıq təsdiqlənib" });
  }
  try {
    // Yeni kod oluştur
    const verificationcode = crypto.randomInt(100000, 999999).toString();
    user.verificationcode = verificationcode;
    await user.save();

    // 📧 Mail gönder
    await sendMail(
      email,
      "Yeni Doğrulama Kodu",
      `Doğrulama kodunuz: ${verificationCode}`,
      `<h2>Salam ${user.fullname}</h2>
       <p>Yeni doğrulama kodunuz: <b>${verificationcode}</b></p>`
    );

    return res.status(200).json({ mesaj: "Kod yenidən göndərildi" });
  } catch (error) {
    console.log("Mail gönderme hatası:", error);
    return res.status(500).json({ hata: "Kod göndərilə bilmədi" });
  }
};

exports.registerToken = async (req, res) => {
  try {
    let { fcmToken } = req.body;
    const userId = req.userId;

    // Basic checks
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: "Token gerekli" });
    }
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Dogrulama gerekli" });
    }

    // Eğer frontend obje yolladıysa (ör. { data: '...' }) normalize et
    if (typeof fcmToken === "object" && fcmToken !== null) {
      if (typeof fcmToken.data === "string") {
        fcmToken = fcmToken.data;
      } else {
        // stringify fallback (gerektiğinde)
        fcmToken = String(fcmToken);
      }
    }

    // Trim ve kontrol
    fcmToken = String(fcmToken).trim();
    if (!fcmToken) {
      return res
        .status(400)
        .json({ success: false, message: "Token boş olamaz" });
    }

    // Token format kontrolü: Expo token veya FCM token kabul et
    const isExpoToken = /^ExponentPushToken\[[^\]]+\]$/.test(fcmToken);
    const isExpoPushToken = /^ExpoPushToken\[[^\]]+\]$/.test(fcmToken);
    // FCM token: Firebase FCM format veya genel push token format
    const isFcmToken =
      fcmToken.startsWith("ExponentPushToken[") ||
      fcmToken.startsWith("ExpoPushToken[") ||
      (fcmToken.length >= 20 &&
        fcmToken.length <= 4096 &&
        /^\S+$/.test(fcmToken));

    if (!isExpoToken && !isExpoPushToken && !isFcmToken) {
      console.log("Rejected token format:", fcmToken);
      return res
        .status(400)
        .json({ success: false, message: "Geçersiz token formatı" });
    }

    console.log("Incoming push token:", fcmToken, "UserId:", userId);

    // Başka kullanıcıların elindeki aynı token'ı temizle
    await User.updateMany({}, { $pull: { fcmToken: fcmToken } });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { fcmToken: fcmToken },
    });

    return res.json({ success: true, message: "Token kaydedildi" });
  } catch (err) {
    console.error("registerToken error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ hata: "Bütün məcburi sahələr doldurulmalıdır" });
  }
  try {
    const existinguser = await User.findOne({ email });

    if (!existinguser) {
      logger.warn("Login prosesi ugursuzdur,Istifadəçi tapılmadı", { email });
      return res
        .status(400)
        .json({ hata: "Bu istifadəçi mövcud deyil. Qeydiyyatdan keçin" });
    }

    const ispasswordcorrect = await bcrypt.compare(
      password,
      existinguser.password
    );

    if (!ispasswordcorrect) {
      logger.warn("Sifre yanlışdır", { email });

      return res.status(400).json({ hata: "Yanlış parol" });
    }

    if (!existinguser.isverified) {
      return res.status(404).json({ hata: "İstifadəçi doğrulanmadı" });
    }

    // Generate both access and refresh tokens
    const { accessToken, refreshToken } = generateTokens(existinguser._id);

    // Save refresh token to database
    const hashedrefreshtoken = await bcrypt.hash(refreshToken, 10);
    existinguser.refreshToken = hashedrefreshtoken;
    await existinguser.save();
    logger.info("Login ugurludur", { email });

    return res.status(200).json({
      mesaj: "Uğurlu giriş",
      accessToken,
      refreshToken,
      user: {
        id: existinguser._id,
        fullname: existinguser.fullname,
        email: existinguser.email,
        privilige: existinguser.privilige,
        phone: existinguser.phone,
        cins: existinguser.cins,
      },
    });
  } catch (err) {
    console.error("Giriş xətası:", err);
    return res.status(500).json({ hata: "Server xətası baş verdi" });
  }
};

// New function to refresh access token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ hata: "Refresh token tələb olunur" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    logger.info("Refresh token dogrulandi", { userId: decoded.userId });

    if (decoded.type !== "refresh") {
      return res.status(401).json({ hata: "Geçersiz token tipi" });
    }

    // Find user and check if refresh token matches
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshToken) {
      return res.status(401).json({ hata: "Gecersiz refresh token" });
    }

    const ismatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!ismatch) {
      return res.status(401).json({ hata: "Geçersiz refresh token" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id
    );

    // DB’ye kaydet
    const hashedrefreshtoken = await bcrypt.hash(newRefreshToken, 10);
    user.refreshToken = hashedrefreshtoken;
    await user.save();

    return res.status(200).json({
      mesaj: "Token yeniləndi",
      accessToken,
      refreshToken: newRefreshToken, // frontend de bunu kaydetmeli
    });
  } catch (err) {
    console.error("Token yeniləmə xətası:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ hata: "Refresh token müddəti bitib" });
    }
    logger.error("Refresh token hatası", { error: err.message });
    return res.status(401).json({ hata: "Geçersiz refresh token" });
  }
};

// New function to logout and clear refresh token
exports.logout = async (req, res) => {
  try {
    const userId = req.userId;
    const { refreshToken } = req.body;

    if (!userId) {
      return res.status(401).json({ hata: "İstifadəçi doğrulama uğursuzdur" });
    }

    // Verify refresh token before clearing
    if (refreshToken) {
      const user = await User.findById(userId);
      if (user && user.refreshToken) {
        const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isMatch) {
          return res.status(401).json({ hata: "Geçersiz refresh token" });
        }
      }
    }

    // Clear refresh token from database
    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
      fcmToken: [],
      lastLogout: new Date(),
    });

    // Log logout event
    logger.info("User logged out successfully", { userId });

    return res.status(200).json({ mesaj: "Uğurla çıxış edildi" });
  } catch (err) {
    console.error("Logout error:", err);
    logger.error("Logout error", { error: err.message, userId: req.userId });
    return res.status(500).json({ hata: "Server xətası baş verdi" });
  }
};

exports.setgender = async (req, res) => {
  const { cins, email, cumemescidi } = req.body;
  if (!cins) {
    return res.status(400).json({ hata: "Cins seçilməlidir" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ hata: "İstifadəçi tapılmadı" });
    }
    console.log("mescid:", cumemescidi);
    user.cins = cins;
    user.cumemescidi = cumemescidi;
    await user.save();

    return res.status(200).json({ mesaj: "Cins uğurla qeyd edildi" });
  } catch (err) {
    console.error("Cins qeyd xətası:", err);
    return res.status(500).json({ hata: "Server xətası baş verdi" });
  }
};

exports.getme = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      console.log("❌ [getMe] userId bulunamadı");
      return res.status(401).json({
        success: false,
        message: "Yetkilendirme hatası: userId bulunamadı",
      });
    }

    console.log("🔍 [getMe] Searching for user with ID:");

    // Şifre, doğrulama kodu ve diğer hassas alanları hariç tut
    const hiddenFields = "-password -verificationcode -__v";
    const user = await User.findById(userId).select(hiddenFields);

    if (!user) {
      console.log("❌ [getMe] User not found for ID:");
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı",
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
    console.error("❌ [getMe] Kullanıcı bilgisi alınırken hata:", error);

    return res.status(500).json({
      success: false,
      message: "Sunucu hatası oluştu",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.changepassword = async (req, res) => {
  const { currentpassword, newpassword } = req.body;
  if (!req.userId) {
    return res.status(401).json({ hata: "İstifadəçi doğrulama uğursuzdur" });
  }

  if (!currentpassword && !newpassword) {
    return res.status(400).json({ hata: "Köhnə və yeni şifrələr məcburidir" });
  }
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ hata: "İstifadəçi tapılmadı" });
    }

    const ismatch = await bcrypt.compare(currentpassword, user.password);
    if (!ismatch) {
      return res.status(401).json({ hata: "Mövcud şifrə yanlışdır" });
    }

    const hashednewpassword = await bcrypt.hash(newpassword, 10);
    user.password = hashednewpassword;
    await user.save();

    return res.status(200).json({ mesaj: "Şifrə uğurla yeniləndi" });
  } catch (error) {
    console.error("Şifrə yeniləmə xətasi", error);
    res.status(500).json({ hata: "Server xetasi bas verdi" });
  }
};

exports.deleteaccount = async (req, res) => {
  const { email, password } = req.body;
  const userId = req.userId;

  if (!email && !password) {
    return res.status(400).json({ message: "Bütün sahələri doldurun" });
  }

  try {
    const errors = [];
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    if (user.email !== email) {
      return res.status(404).json({ message: "Email səhvdir" });
    }
    const ispasswordcorrect = await bcrypt.compare(password, user.password);

    if (!ispasswordcorrect) {
      return res.status(400).json({ message: "Şifrə səhvdir" });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "Hesab ugurla silindi" });
  } catch (error) {
    console.error("Hesab silinerken xeta bas verdi", error);
    return res.status(500).json({ message: "Server xətasi" });
  }
};

exports.updateuserinfo = async (req, res) => {
  const { fullname, email, phone, cins } = req.body;

  if (!req.userId) {
    return res.status(401).json({ hata: "İstifadəçi doğrulama uğursuzdur" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ hata: "İstifadəçi tapilmadi" });

    // ✅ Email kontrolü – format ve benzersizlik (isteğe bağlı)
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ hata: "Zəhmət olmasa düzgün email daxil edin" });
      }
      user.email = email;
    }

    if (fullname !== undefined) user.fullname = fullname;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (cins !== undefined) user.cins = cins;

    await user.save();
    res.status(200).json({ mesaj: "Profil yeniləndi", profil: user });
  } catch (err) {
    console.error("Update hatası:", err);
    res.status(500).json({ hata: "Server xətası" });
  }
};

exports.sendmessage = async (req, res) => {
  try {
    const { fullname, title, message, userId } = req.body;

    if (!fullname && !title && !message) {
      return res.status(400).json({ hata: "Bilgilər əskikdir" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ hata: "Istifadəçi tapılmadı" });
    }

    user.mesajlar.push({ fullname, title, message });
    await user.save();

    res.status(201).json({ success: true, message: "Mesaj uğurla göndərildi" });
  } catch (error) {
    return res.status(500).json({ hata: error.message });
  }
};

exports.getmessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
};

exports.replymessages = async (req, res) => {
  try {
    const { reply } = req.body;
    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      { reply, status: "answered" },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ hata: err.message });
  }
};

exports.getping = async (req, res) => {
  try {
    res.status(200).json({ mesaj: "ping basarili" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mesaj: "server xetasi" });
  }
};

exports.forgotpasssendcode = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ hata: "İstifadəçi mövcud deyil" });
  }

  const verificationcode = crypto.randomInt(100000, 999999).toString();

  user.forgotpassverifycode = verificationcode;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailoptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email doğrulama kodu",
    text: `Email doğrulama kodunuz ${verificationcode}`,
  };

  await transporter.sendMail(mailoptions);

  return res.status(201).json({
    mesaj: "Email doğrulama kodu göndərildi,Zəhmət olmasa e-mailinizi yoxlayın",
  });
};

exports.forgotpassverify = async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ hata: "Istifadəçi tapılmadı" });
  }
  if (user.forgotpassverifycode === code) {
    user.forgotpassverifycode = null;
    await user.save();

    return res.status(200).json({ message: "Doğrulama uğurla tamamlandı" });
  } else {
    return res.status(400).json({ hata: "Kod yanlışdır" });
  }
};

exports.forgotpasschange = async (req, res) => {
  const { email, newpassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ hata: "Istifadəçi tapılmadı" });
    }

    const hashednewpassword = await bcrypt.hash(newpassword, 10);
    user.password = hashednewpassword;
    await user.save();
    return res.status(200).json({ mesaj: "Şifrə ugurla dəyişdirildi" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server xetasi" });
  }
};

exports.getimam = async (req, res) => {
  const { email } = req.body;
  try {
    const imam = await Admin.find({ email }); // sadece adminler

    res.status(200).json({ success: true, users: imam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.imamlogin = async (req, res) => {
  const { email, seccode, password } = req.body;
  const user = await Admin.findOne({ email });

  if (!user) {
    return res.status(400).json({ hata: "İstifadəçi tapılmadı" });
  }

  const matchpass = await bcrypt.compare(password, user.password);
  const matchseccode = await bcrypt.compare(seccode, user.securitycode);

  if (!matchpass) {
    return res.status(400).json({ hata: "Şifrə yanlışdır" });
  }

  if (!matchseccode) {
    return res.status(400).json({ hata: "Təhlükəsizlik kodu yanlışdır" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  return res.status(200).json({
    mesaj: "Uğurlu giriş",
    accessToken: token,
    user: {
      id: user._id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      surname: user.surname,
      name: user.name,
      cins: user.cins,
    },
  });
};

// Add to backend/controller/authcontrol.js
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = await Notification.find({
      sentTo: userId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.changemescid = async (req, res) => {
  const { cumemescidi } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ hata: "Istifadəçi tapılmadı" });
    }

    user.cumemescidi = cumemescidi;
    await user.save();
    return res.status(200).json({ mesaj: "ugurla deyisdirildi", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server xetasi" });
  }
};
