const fs = require("fs");
const path = require("path");
const {
  arabicmushaf,
  enasadmushaf,
  trdiyanetmushaf,
  mammadaliyevmushaf,
} = require("../schema/Sura");

exports.getversion = function (req, res) {
  const versionpath = path.join(__dirname, "../versioncheck.json");

  fs.readFile(versionpath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading version file:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    try {
      const versionData = JSON.parse(data);
      res.json(versionData);
    } catch (error) {
      console.error(error, "Error parsing version file");
      return res.status(500).json({ error: "Error parsing version data" });
    }
  });
};

// Tüm sûrelerin minimal bilgilerini döndür
exports.getmushafaz = async (req, res) => {
  try {
    const data = await mammadaliyevmushaf.find();

    // Sadece gerekli alanları seç
    const minimalData = data.map((surah) => ({
      number: surah.number,
      name: surah.name,
      numberOfAyahs: surah.numberOfAyahs,
    }));

    res.json(minimalData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Tek sûre + ayetleri (sayfalama destekli)
exports.getsurahaz = async (req, res) => {
  try {
    const { surahnumber } = req.params;

    // Sûreyi bul
    const surah = await mammadaliyevmushaf.findOne({ number: surahnumber });

    if (!surah) {
      return res.status(404).json({ message: "Sûre bulunamadı" });
    }

    // Ayetleri sayfalama ile slice et
    res.json({
      surahnumber: surah.number,
      name: surah.name,
      totalVerses: surah.numberOfAyahs, // <-- sadece sayı
      verses: surah.ayahs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
