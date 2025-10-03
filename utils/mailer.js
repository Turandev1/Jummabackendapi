const sgMail = require("@sendgrid/mail");

// API key tanımla
sgMail.setApiKey(process.env.SENDGRID_APIKEY);

// Mail gönderme fonksiyonu
const sendMail = async (to, subject,text, html) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM, // doğrulanmış mail adresin
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Mail gönderildi:", to);
    return true;
  } catch (error) {

    if (error.response && error.response.body) {
      console.error("x sendgrid api hatasi",error.response.body)
    } else {
      console.error("x hata:",error.message)
    }
    return false
  }
};

module.exports = sendMail;
