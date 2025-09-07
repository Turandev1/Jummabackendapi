const express = require("express");
const router = express.Router();
const authcontroller = require("../controller/authcontrol");
const authenticateUser = require("../middleware/authmiddle");

router.post("/signup", authcontroller.signup);
router.post("/login", authcontroller.login);
router.post("/verify", authcontroller.verifyemail);
router.post("/refresh", authcontroller.refreshToken); // New refresh token route
router.post("/setgender", authcontroller.setgender);
router.get('/getping', authcontroller.getping)
router.get('/resendcode',authcontroller.resendVerificationCode)
router.get("/getme", authenticateUser, authcontroller.getme);
//account process routes
router.put("/changepassword", authenticateUser, authcontroller.changepassword);
router.delete("/deleteaccount", authenticateUser, authcontroller.deleteaccount);
router.put("/updateuserinfo", authenticateUser, authcontroller.updateuserinfo);
router.post("/logout", authenticateUser, authcontroller.logout); // New logout route
router.post("/forgotpasssendcode", authcontroller.forgotpasssendcode);
router.post("/forgotpassverify", authcontroller.forgotpassverify);
router.post("/forgotpasschange", authcontroller.forgotpasschange);


//message process
router.post("/message/sendmessages", authcontroller.sendmessage);
router.get("/message/getmessages", authcontroller.getmessages);
router.put("/message/:id/reply", authcontroller.replymessages);

module.exports = router;
