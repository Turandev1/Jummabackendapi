const express = require("express");
const router = express.Router();
const appcontroller = require("../controller/maincontroller");




router.get('/getversion', appcontroller.getversion)



module.exports=router