const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// Reads "Authorization: Bearer <token>", loads the user and attaches it to req.user.
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Please log in.' });
    const decoded = jwt.verify(header.slice(7), config.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user || user.status === 'deactivated') return res.status(401).json({ message: 'Account not available.' });
    req.user = user;
    next();
  } catch (err) { res.status(401).json({ message: 'Session expired. Please log in again.' }); }
};
// Restricted accounts can browse but cannot create listings or reports.
exports.requireActive = (req, res, next) => {
  if (!req.user.isVerified || req.user.status !== 'active') return res.status(403).json({ message: 'Your account is not allowed to do this.' });
  next();
};
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
  next();
};
