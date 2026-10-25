const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const { ratingMap } = require('../ratings');
const { protect } = require('../middleware/auth');

// Public seller page: name, rating, reviews and active items. No email shown.
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Student not found.' });
    const user = await User.findById(req.params.id).select('name branch semester bio createdAt status');
    if (!user || user.status === 'deactivated') return res.status(404).json({ message: 'Student not found.' });
    const [map, reviews, listings, soldCount] = await Promise.all([
      ratingMap([user._id]),
      Review.find({ seller: user._id }).sort({ createdAt: -1 }).limit(20).populate('reviewer', 'name').populate('listing', 'title'),
      Listing.find({ seller: user._id, status: 'active' }).sort({ createdAt: -1 }),
      Listing.countDocuments({ seller: user._id, status: 'sold' }),
    ]);
    res.json({ user, rating: map[String(user._id)] || { avg: 0, count: 0 }, reviews, listings, soldCount });
  } catch (err) { next(err); }
});
module.exports = router;
