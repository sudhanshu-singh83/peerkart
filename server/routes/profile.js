const router = require('express').Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Image = require('../models/Image');
const upload = require('../middleware/upload');
const publicUser = require('../userView');
const { protect } = require('../middleware/auth');
const PHONE = /^[6-9]\d{9}$/;

// Only these fields can be changed. Email, role and status can never be edited here.
router.put('/', protect, async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    const phone = (req.body.phone || '').trim();
    if (name.length < 2 || name.length > 60) return res.status(400).json({ message: 'Name must be 2-60 characters.' });
    if (phone && !PHONE.test(phone)) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
    req.user.name = name;
    if (phone) req.user.phone = phone;
    req.user.branch = (req.body.branch || '').trim().slice(0, 40);
    req.user.semester = (req.body.semester || '').trim().slice(0, 10);
    req.user.bio = (req.body.bio || '').trim().slice(0, 200);
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) { next(err); }
});

router.put('/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    if (!(await bcrypt.compare(currentPassword || '', req.user.passwordHash))) return res.status(400).json({ message: 'Current password is wrong.' });
    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    res.json({ message: 'Password changed.' });
  } catch (err) { next(err); }
});

// Deletes the old profile photo from the database
async function removeOldAvatar(user) {
  const id = user.avatar && user.avatar.split('/').pop();
  if (id && mongoose.isValidObjectId(id)) await Image.deleteOne({ _id: id });
}
router.put('/avatar', protect, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose a photo first.' });
    const [url] = await upload.saveToDb([req.file], req.user._id);
    await removeOldAvatar(req.user);
    req.user.avatar = url; await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) { next(err); }
});
router.delete('/avatar', protect, async (req, res, next) => {
  try { await removeOldAvatar(req.user); req.user.avatar = ''; await req.user.save(); res.json({ user: publicUser(req.user) }); } catch (err) { next(err); }
});
module.exports = router;
