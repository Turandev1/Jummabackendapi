// File: backend/utils/errorMessages.js
const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELDS: "Bütün məcburi sahələr doldurulmalıdır",
    INVALID_EMAIL: "Düzgün email daxil edin",
    PASSWORD_MISMATCH: "Parollar uyğun deyil",
    WEAK_PASSWORD:
      "Şifrə ən azı 8 simvol, böyük hərf, kiçik hərf, rəqəm və xüsusi simvol olmalıdır",
  },
  AUTH: {
    USER_NOT_FOUND: "İstifadəçi tapılmadı",
    INVALID_CREDENTIALS: "Yanlış məlumatlar",
    TOKEN_EXPIRED: "Token müddəti bitib",
    UNAUTHORIZED: "Yetkilendirme reddedildi",
  },
};

module.exports = ERROR_MESSAGES;
