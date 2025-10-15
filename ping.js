require("dotenv").config();
const axios =require("axios");

const keepAwake = async () => {
  try {
    const response = await axios.get(process.env.BACKEND_URL);
    console.log('ping ugurludur')

    // console.log(`[${new Date().toLocaleString()}] ✅ Ping başarılı`);
    // console.log("Status:", response.status);
    // console.log("Data:", response.data);
  } catch (error) {
    console.error(
      `[${new Date().toLocaleString()}] ❌ Ping hatası:`,
      error && error.message ? error.message : error
    );
  }
};

keepAwake();
setInterval(keepAwake, 13 * 60 * 1000);
