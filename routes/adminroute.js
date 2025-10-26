const admincontroller = require("../controller/admincontroller");
const express = require("express");
const router = express.Router();
const adminmiddleware = require("../middleware/adminmiddleware");

router.post("/admin-login", admincontroller.adminlogin);
router.post("/admin-logout", admincontroller.adminlogout);
router.post("/refreshToken", admincontroller.refreshToken);
router.post("/edit-admin", admincontroller.editadmin);
router.put("/signup-admin", admincontroller.signupadmin);
router.get('/get-ianeler',admincontroller.getianeler)
router.patch("/mark-asread/:id", admincontroller.markasread);
router.patch("/mark-asunread/:id", admincontroller.markasunread);
router.patch('/approve-iane/:id',admincontroller.approveiane)
router.patch("/reject-iane/:id", admincontroller.rejectiane);


module.exports = router;
