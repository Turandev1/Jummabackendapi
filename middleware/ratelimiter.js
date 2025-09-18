// File: backend/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 26, // limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
});

const notificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 notifications per minute
  message: "Too many notification requests",
  keyGenerator: (req) => req.userId || rateLimit.ipKeyGenerator(req,res),
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 password reset attempts per 15 minutes
  message: "Too many password reset attempts",
  keyGenerator: (req) => req.body.email || rateLimit.ipKeyGenerator(req,res),
});

const tokenRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 5 token refresh requests per windowMs
  message: {
    hata: "Çox sayda token yeniləmə tələbi. Zəhmət olmasa bir az gözləyin.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  generalLimiter,
  tokenRefreshLimiter,
  notificationLimiter,
  passwordResetLimiter,
};
