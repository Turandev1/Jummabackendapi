const sgMail = require("@sendgrid/mail");

// API key tanımla
sgMail.setApiKey(process.env.SENDGRID_APIKEY);

// Mail gönderme fonksiyonu
const sendMail = async (to, subject, html) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM, // doğrulanmış mail adresin
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Mail gönderildi:", to);
    return true;
  } catch (error) {
    console.error("❌ Mail gönderme hatası:", error.response?.body || error);
    return false;
  }
};

module.exports = sendMail;
