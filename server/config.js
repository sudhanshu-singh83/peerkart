require('dotenv').config();
// All settings live here so the rest of the code never reads process.env directly.
const end = new Date((process.env.SEMESTER_END_DATE || '2026-12-31') + 'T23:59:59');
module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  semesterEnd: end,
  emailDomain: '@glbitm.ac.in',
  smtp: { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, from: process.env.SMTP_FROM },
};
