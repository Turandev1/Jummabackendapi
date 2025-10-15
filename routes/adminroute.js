const admincontroller = require('../controller/admincontroller')
const express = require('express')
const router = express.Router()
const adminmiddleware=require('../middleware/adminmiddleware')



router.post('/admin-login', admincontroller.adminlogin)
router.post("/admin-logout",adminmiddleware, admincontroller.adminlogout);
router.post("/refreshToken", admincontroller.refreshToken);




module.exports=router