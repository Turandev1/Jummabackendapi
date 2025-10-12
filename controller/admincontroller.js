const Admin = require("../schema/Admin");
const jwt = require("jsonwebtoken");

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
  try {
    const user = await Admin.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, hata: "Admin tapılmadı" });
    }

    if (password !== user.password) {
      res.status(400).json({ hata: "Sifre yanlışdır" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res
      .status(200)
      .json({ mesaj: "Giriş ugurludur", success: true, accessToken ,user});
  } catch (error) {
    console.error(error);
  }
};
