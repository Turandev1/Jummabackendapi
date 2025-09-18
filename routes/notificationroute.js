const express = require("express");
const router = express.Router();
const notifconroller = require("../controller/notificationcontroller");
const authenticateuser=require('../middleware/adminmiddleware');
const adminmiddleware = require("../middleware/adminmiddleware");


router.post("/sendnotification", notifconroller.sendcumanotification);


module.exports = router


