const express = require("express");
const router = express.Router();
const webcontroller = require("../controller/imamcontroller");
const authenticateuser = require("../middleware/authmiddle");
const adminmiddleware = require("../middleware/adminmiddleware");

// Public routes
router.post("/imamsignup", webcontroller.imamsignup);
router.post("/imamlogin", webcontroller.imamlogin);
router.post("/imamloginweb", webcontroller.imamloginweb);
router.post("/refreshtokens", webcontroller.refreshToken);
router.post("/refreshtokenweb", webcontroller.refreshTokenweb);
router.post("/logout", webcontroller.logout);

// Protected routes
router.post(
  "/changepassword",
  adminmiddleware,
  webcontroller.changeImamPassword
);
router.post("/setiane", webcontroller.setiane);
router.get("/getme", adminmiddleware, webcontroller.getme);
router.get("/getadmins", adminmiddleware, webcontroller.getadmins);
router.get("/getimams", adminmiddleware, webcontroller.getimams);
router.get("/getusers", adminmiddleware, webcontroller.getusers);
router.get("/getmescids", webcontroller.getmescids);
router.get("/verifyimam", adminmiddleware, webcontroller.verifyimam);
router.put("/editimamacc", webcontroller.editimamacc);

module.exports = router;
