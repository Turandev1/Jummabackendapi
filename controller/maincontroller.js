const fs = require("fs");
const path = require("path");

exports.getversion = function (req, res) {
  const versionpath = path.join(__dirname, '../versioncheck.json');

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
