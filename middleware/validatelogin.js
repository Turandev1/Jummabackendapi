// File: backend/middleware/validation.js
const { body, validationResult } = require("express-validator");

const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 5 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = validateLogin;
