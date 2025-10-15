const express = require("express");
const router = express.Router();
const webcontroller = require("../controller/imamcontroller");
const authenticateuser = require("../middleware/authmiddle");
const adminmiddleware=require('../middleware/adminmiddleware')


// Public routes
router.post("/imamsignup",webcontroller.imamsignup);
router.post("/imamlogin",webcontroller.imamlogin);
router.get("/verifyimam",adminmiddleware,webcontroller.verifyimam);
router.post("/refreshtokens",webcontroller.refreshToken);

// Protected routes
router.post("/changepassword",adminmiddleware,webcontroller.changeImamPassword);
router.post("/logout", webcontroller.logout);
router.put("/editimamacc/:id",webcontroller.editimamacc);
router.get("/getme",webcontroller.getme);
router.get("/getadmins",webcontroller.getadmins);
router.get("/getimams",webcontroller.getimams);
router.get("/getusers",webcontroller.getusers);
router.get("/getmescids",webcontroller.getmescids);

module.exports = router;

