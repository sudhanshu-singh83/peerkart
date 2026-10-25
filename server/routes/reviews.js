const router = require('express').Router();
const mongoose = require('mongoose');
const Request = require('../models/Request');
const Review = require('../models/Review');
const { protect, requireActive } = require('../middleware/auth');

// Only a buyer whose request was accepted can rate that seller, once per item.
router.post('/', protect, requireActive, async (req, res, next) => {
  try {
    const { listingId, rating, comment } = req.body;
    if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: 'Invalid listing.' });
    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return res.status(400).json({ message: 'Rating must be 1 to 5 stars.' });
    if (comment && comment.length > 300) return res.status(400).json({ message: 'Comment must be under 300 characters.' });
    const accepted = await Request.findOne({ listing: listingId, buyer: req.user._id, status: 'accepted' });
    if (!accepted) return res.status(403).json({ message: 'You can only rate sellers whose request you had accepted.' });
    await Review.create({ listing: listingId, seller: accepted.seller, reviewer: req.user._id, rating: stars, comment: comment || '' });
    res.status(201).json({ message: 'Thanks for rating the seller.' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already rated this seller for this item.' });
    next(err);
  }
});
module.exports = router;
