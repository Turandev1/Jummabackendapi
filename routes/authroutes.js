const express = require("express");
const router = express.Router();
const authcontroller = require("../controller/authcontrol");
const authenticateUser = require("../middleware/authmiddle");
const validatelogin =require('../middleware/validatelogin')
const ratelimit = require('../middleware/ratelimiter')

router.post('/create-account',authcontroller.createaccount)
router.post("/signup",ratelimit.authLimiter, authcontroller.signup);
router.put("/login", validatelogin, ratelimit.authLimiter, authcontroller.login);

const { tokenRefreshLimiter } = require('../middleware/ratelimiter')

router.post("/refresh", tokenRefreshLimiter, authcontroller.refreshToken); // New refresh token route
router.post("/setgender", authcontroller.setgender);
router.get("/getping", authcontroller.getping);
//account process routes

router.patch("/changepassword", authenticateUser, authcontroller.changepassword);
router.post("/forgotpasssendcode",ratelimit.authLimiter, authcontroller.forgotpasssendcode);
router.post("/forgotpassverify",ratelimit.authLimiter, authcontroller.forgotpassverify);
router.post("/forgotpasschange", authcontroller.forgotpasschange);
router.post("/imamlogin", authcontroller.imamlogin);
router.post("/getimam", authcontroller.getimam);
router.post('/notifstatus',authcontroller.notifstatus)
//post servere yeni bir sey elave et
//put datani tamamen silib yeniden yazir
//patch qismi yenileme ucun istifade olunur

//authenticaateuser middleware routes
router.post("/register-token",authenticateUser, authcontroller.registerToken);
router.get("/getme", authenticateUser, authcontroller.getme);
router.delete("/deleteaccount", authenticateUser, authcontroller.deleteaccount);
router.put("/updateuserinfo", authenticateUser, authcontroller.updateuserinfo);
router.post("/logout", authenticateUser, authcontroller.logout); // New logout route
router.get("/getnotifications", authenticateUser, authcontroller.getNotifications);


//
router.put('/changemescid',authcontroller.changemescid)


// message routes removed due to missing Message model; reintroduce when implemented

module.exports = router;
