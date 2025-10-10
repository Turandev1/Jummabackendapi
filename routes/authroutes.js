const express = require("express");
const router = express.Router();
const authcontroller = require("../controller/authcontrol");
const authenticateUser = require("../middleware/authmiddle");
const validatelogin =require('../middleware/validatelogin')
const ratelimit = require('../middleware/ratelimiter')

router.post('/create-account',authcontroller.createaccount)
router.post("/signup",ratelimit.authLimiter, authcontroller.signup);
router.post("/login", validatelogin,ratelimit.authLimiter, authcontroller.login);
router.post("/register-token",authenticateUser, authcontroller.registerToken);
const { tokenRefreshLimiter } = require('../middleware/ratelimiter')
router.post("/refresh", tokenRefreshLimiter, authcontroller.refreshToken); // New refresh token route
router.post("/setgender", authcontroller.setgender);
router.get("/getping", authcontroller.getping);
router.get("/getme", authenticateUser, authcontroller.getme);
//account process routes
router.put("/changepassword", authcontroller.changepassword);
router.delete("/deleteaccount", authenticateUser, authcontroller.deleteaccount);
router.put("/updateuserinfo", authenticateUser, authcontroller.updateuserinfo);
router.post("/logout", authenticateUser, authcontroller.logout); // New logout route
router.post("/forgotpasssendcode",ratelimit.authLimiter, authcontroller.forgotpasssendcode);
router.post("/forgotpassverify",ratelimit.authLimiter, authcontroller.forgotpassverify);
router.post("/forgotpasschange", authcontroller.forgotpasschange);
router.post("/imamlogin", authcontroller.imamlogin);
router.post("/getimam", authcontroller.getimam);
router.get("/getnotifications", authenticateUser, authcontroller.getNotifications);


//
router.put('/changemescid',authcontroller.changemescid)


// message routes removed due to missing Message model; reintroduce when implemented

module.exports = router;
