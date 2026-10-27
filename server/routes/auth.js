const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../mailer');
const { protect } = require('../middleware/auth');
const publicUser = require('../userView');
const PHONE = /^[6-9]\d{9}$/;

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many attempts. Try again later.' } });
router.use(limiter);

const isCollegeEmail = (e) => typeof e === 'string' && /^[^\s@]+@glbitm\.ac\.in$/i.test(e.trim());
const signToken = (id) => jwt.sign({ id }, config.jwtSecret, { expiresIn: '7d' });

// Step 1: send an OTP to the college email
router.post('/request-otp', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Please enter your name.' });
    if (!isCollegeEmail(email)) return res.status(400).json({ message: 'Only @glbitm.ac.in emails are allowed.' });
    const clean = email.trim().toLowerCase();
    if (await User.findOne({ email: clean })) return res.status(409).json({ message: 'This email is already registered. Please log in.' });

    const old = await Otp.findOne({ email: clean });
    if (old && Date.now() - old.lastSentAt < 60 * 1000) return res.status(429).json({ message: 'Please wait 60 seconds before requesting another OTP.' });

    const otp = String(crypto.randomInt(100000, 1000000));
    await sendOtpEmail(clean, otp); // throws if SMTP is not configured
    await Otp.findOneAndUpdate({ email: clean },
      { otpHash: await bcrypt.hash(otp, 8), expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0, lastSentAt: new Date() },
      { upsert: true });
    res.json({ message: 'OTP sent. Check your college inbox.' });
  } catch (err) { next(err); }
});

// Step 2: check the OTP. On success we hand back a short-lived registration token.
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { name, email, otp } = req.body;
    if (!isCollegeEmail(email) || !/^\d{6}$/.test(otp || '')) return res.status(400).json({ message: 'Enter a valid email and 6-digit OTP.' });
    const clean = email.trim().toLowerCase();
    const record = await Otp.findOne({ email: clean });
    if (!record) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    if (record.attempts >= 5) return res.status(429).json({ message: 'Too many wrong attempts. Request a new OTP.' });
    if (!(await bcrypt.compare(otp, record.otpHash))) {
      record.attempts += 1; await record.save();
      return res.status(400).json({ message: 'Incorrect OTP.' });
    }
    await record.deleteOne();
    const registrationToken = jwt.sign({ email: clean, name: (name || '').trim(), purpose: 'register' }, config.jwtSecret, { expiresIn: '15m' });
    res.json({ registrationToken });
  } catch (err) { next(err); }
});

// Step 3: set a password and create the verified account
router.post('/register', async (req, res, next) => {
  try {
    const { registrationToken, password, phone, branch, semester } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (!PHONE.test(phone || '')) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
    if (!branch || branch.length > 40 || !/^[1-8]$/.test(String(semester))) return res.status(400).json({ message: 'Choose your branch and semester (1-8).' });
    let data;
    try { data = jwt.verify(registrationToken, config.jwtSecret); } catch { return res.status(400).json({ message: 'Verification expired. Start again.' }); }
    if (data.purpose !== 'register') return res.status(400).json({ message: 'Invalid token.' });
    if (await User.findOne({ email: data.email })) return res.status(409).json({ message: 'Already registered.' });
    // role is never read from the request body - always "student"
    const user = await User.create({ name: data.name, email: data.email, passwordHash: await bcrypt.hash(password, 10), isVerified: true, phone, branch, semester: String(semester) });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) { next(err); }
});

// Forgot password, step 1: email an OTP to a registered student
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!isCollegeEmail(email)) return res.status(400).json({ message: 'Only @glbitm.ac.in emails are allowed.' });
    const clean = email.trim().toLowerCase();
    const generic = { message: 'If this email is registered, an OTP has been sent to it.' };
    const user = await User.findOne({ email: clean });
    if (!user || user.status === 'deactivated') return res.json(generic); // same answer, so emails cannot be guessed
    const old = await Otp.findOne({ email: clean });
    if (old && Date.now() - old.lastSentAt < 60 * 1000) return res.status(429).json({ message: 'Please wait 60 seconds before requesting another OTP.' });
    const otp = String(crypto.randomInt(100000, 1000000));
    await sendOtpEmail(clean, otp);
    await Otp.findOneAndUpdate({ email: clean },
      { otpHash: await bcrypt.hash(otp, 8), expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0, lastSentAt: new Date() }, { upsert: true });
    res.json(generic);
  } catch (err) { next(err); }
});

// Forgot password, step 2: check the OTP and set a new password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!isCollegeEmail(email) || !/^\d{6}$/.test(otp || '')) return res.status(400).json({ message: 'Enter a valid email and 6-digit OTP.' });
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const clean = email.trim().toLowerCase();
    const [record, user] = await Promise.all([Otp.findOne({ email: clean }), User.findOne({ email: clean })]);
    if (!record || !user) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    if (record.attempts >= 5) return res.status(429).json({ message: 'Too many wrong attempts. Request a new OTP.' });
    if (!(await bcrypt.compare(otp, record.otpHash))) { record.attempts += 1; await record.save(); return res.status(400).json({ message: 'Incorrect OTP.' }); }
    user.passwordHash = await bcrypt.hash(newPassword, 10); await user.save();
    await record.deleteOne();
    res.json({ message: 'Password changed. You can sign in now.' });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ message: 'Wrong email or password.' });
    if (user.status === 'deactivated') return res.status(403).json({ message: 'This account has been deactivated.' });
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get('/me', protect, (req, res) => {
  const u = req.user;
  res.json({ user: publicUser(u) });
});
// JWTs are stateless: logout simply deletes the token in the browser.
router.post('/logout', (req, res) => res.json({ message: 'Logged out.' }));

module.exports = router;
