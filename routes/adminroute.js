const admincontroller = require('../controller/admincontroller')
const express = require('express')
const router = express.Router()




router.post('/admin-login', admincontroller.adminlogin)




module.exports=router