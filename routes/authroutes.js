const express = require('express');
const router = express.Router();
const authcontroller = require('../controller/authcontrol');
const authenticateUser = require('../middleware/authmiddle');

router.post('/signup', authcontroller.signup);
router.post('/login', authcontroller.login);
router.post('/verify',authcontroller.verifyemail)
router.post('/setgender', authenticateUser, authcontroller.setgender);
router.get('/getme', authenticateUser, authcontroller.getme);
module.exports = router;