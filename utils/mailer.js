const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com", // örnek Gmail
  port: process.env.SMTP_PORT || 587,
  secure: false, // 465 ise true olmalı
  auth: {
    user: process.env.EMAIL_USER, // .env dosyasında olmalı
    pass: process.env.EMAIL_PASS,
  },
});

// Basit mail gönderme helper
const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Jumma App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("✅ Mail gönderildi:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Mail gönderme hatası:", err);
    return false;
  }
};

module.exports = sendMail;
