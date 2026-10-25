const nodemailer = require('nodemailer');
const { smtp } = require('./config');
exports.sendOtpEmail = async (to, otp) => {
  if (!smtp.host || !smtp.user || !smtp.pass) { const e = new Error('Email is not configured on the server.'); e.status = 503; throw e; }
  const transporter = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.port === 465, auth: { user: smtp.user, pass: smtp.pass } });
  try {
    await transporter.sendMail({ from: smtp.from || smtp.user, to, subject: 'Your PeerKart verification code',
      text: `Your PeerKart OTP is ${otp}. It expires in 10 minutes. If you did not request it, ignore this email.` });
  } catch (err) {
    console.error('SMTP error:', err.message); // shown in the server terminal to help you debug
    const e = new Error('Could not send the email. Check the SMTP settings in the server .env file.'); e.status = 502; throw e;
  }
};
