const express = require("express");
const router = express.Router();
const appcontroller = require("../controller/maincontroller");




router.get("/getversion", appcontroller.getversion);
router.get("/getmushafaz", appcontroller.getmushafaz);
router.get("/getmushafaz/:surahnumber", appcontroller.getsurahaz);



module.exports=router