const express = require("express");
const router = express.Router();
const webcontroller = require("../controller/admincontroller");
const authenticateuser = require("../middleware/authmiddle");
const adminmiddleware=require('../middleware/adminmiddleware')


// Public routes
router.post("/imamsignup",webcontroller.imamsignup);
router.post("/imamlogin",webcontroller.imamlogin);
router.get("/verifytoken",webcontroller.verifyImamToken);
router.post("/refreshtokens",webcontroller.refreshToken);

// Protected routes
router.post("/changepassword", adminmiddleware,webcontroller.changeImamPassword);
router.post("/logout", adminmiddleware,webcontroller.logout);
router.put("/editimamacc/:id", adminmiddleware,webcontroller.editimamacc);
router.get("/getme", adminmiddleware,webcontroller.getme);
router.get("/getadmins", adminmiddleware,webcontroller.getadmins);
router.get("/getimams", adminmiddleware,webcontroller.getimams);
router.get("/getusers", adminmiddleware,webcontroller.getusers);
router.get("/getmescids",webcontroller.getmescids);

module.exports = router;

