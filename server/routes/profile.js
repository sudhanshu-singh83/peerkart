const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, status: u.status, branch: u.branch, semester: u.semester, bio: u.bio, createdAt: u.createdAt });

// Only these fields can be changed. Email, role and status can never be edited here.
router.put('/', protect, async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    if (name.length < 2 || name.length > 60) return res.status(400).json({ message: 'Name must be 2-60 characters.' });
    req.user.name = name;
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
module.exports = router;
