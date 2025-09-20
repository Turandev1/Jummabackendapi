// File: backend/config/environment.js
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
  "NODE_ENV",
  "FIREBASE_PROJECT_ID", // Add these
  "FIREBASE_CLIENT_EMAIL", // Add these
  "FIREBASE_PRIVATE_KEY",
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:", missing);
    process.exit(1);
  }

  console.log("✅ All required environment variables are set");
};

validateEnvironment();

module.exports = { validateEnvironment };
