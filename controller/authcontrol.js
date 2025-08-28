const User = require("../schema/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

exports.signup = async (req, res) => {
  const { fullname, email, password, confirmpassword, role, privilige, phone } =
    req.body;

  if (!fullname || !email || !password || !confirmpassword) {
    return res
      .status(400)
      .json({ hata: "Bütün məcburi sahələr doldurulmalıdır" });
  }

  if (password !== confirmpassword) {
    return res.status(400).json({ hata: "Parollar uyğun deyil" });
  }

  const existinguser = await User.findOne({ email });
  if (existinguser) {
    return res
      .status(400)
      .json({ hata: "Bu istifadəçi mövcuddur. Giriş edin" });
  }

  const hashedpassword = await bcrypt.hash(password, 10);
  const verificationcode = crypto.randomInt(100000, 999999).toString();
  const newuser = new User({
    fullname,
    email,
    password: hashedpassword,
    role,
    privilige,
    phone,
    isverified: false,
    verificationcode,
  });

  await newuser.save();

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
    mesaj:
      "Qeydiyyat uğurla tamamlandı,Zəhmət olmasa e-poçt kodunuzu daxil edin",
  });
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
      return res
        .status(400)
        .json({ hata: "Bu istifadəçi mövcud deyil. Qeydiyyatdan keçin" });
    }

    const ispasswordcorrect = await bcrypt.compare(
      password,
      existinguser.password
    );
    if (!ispasswordcorrect) {
      return res.status(400).json({ hata: "Yanlış parol" });
    }

    if (!existinguser.isverified) {
      return res.status(404).json({ hata: "İstifadəçi doğrulanmadı" });
    }

    const token = jwt.sign(
      { userId: existinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      mesaj: "Uğurlu giriş",
      token,
      user: {
        id: existinguser._id,
        fullname: existinguser.fullname,
        email: existinguser.email,
        role: existinguser.role,
        privilige: existinguser.privilige,
        phone: existinguser.phone,
      },
    });
  } catch (err) {
    console.error("Giriş xətası:", err);
    return res.status(500).json({ hata: "Server xətası baş verdi" });
  }
};

exports.setgender = async (req, res) => {
  const { cins } = req.body;
  const userId = req.userId;

  if (!cins) {
    return res.status(400).json({ hata: "Cins seçilməlidir" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ hata: "İstifadəçi tapılmadı" });
    }

    user.cins = cins;
    await user.save();

    return res.status(200).json({ mesaj: "Cins uğurla qeyd edildi" });
  } catch (err) {
    console.error("Cins qeyd xətası:", err);
    return res.status(500).json({ hata: "Server xətası baş verdi" });
  }
};

exports.getme = async (req, res) => {
  const userId = req.userId;
  const token = req.token;
  try {
    const user = await User.findById(userId).select(
      "-password -verificationcode"
    );
    if (!user) {
      return res.status(404).json({ hata: "İstifadəçi tapılmadı" });
    }
    return res.status(200).json({ user });
  } catch (err) {
    console.error("İstifadəçi məlumatı xətası:", err);
    return res.status(500).json({ hata: "Server xətası baş verdi" });
  }
};
