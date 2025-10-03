const express = require("express");
const router = express.Router();
const webcontroller = require("../controller/admincontroller");
const authenticateuser = require("../middleware/authmiddle");
const adminmiddleware=require('../middleware/adminmiddleware')



router.post("/imamsignup", webcontroller.imamsignup);
router.post("/imamlogin", webcontroller.imamlogin);
router.put("/editimamacc/:id", webcontroller.editimamacc);
router.get("/getme", adminmiddleware, webcontroller.getme);
router.get("/getadmins", adminmiddleware, webcontroller.getadmins);
router.get("/getimams", adminmiddleware, webcontroller.getimams);
router.get("/getusers", webcontroller.getusers);
router.get("/getmescids", webcontroller.getmescids);

module.exports = router;
