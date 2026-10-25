const router = require('express').Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const Listing = require('../models/Listing');
const { protect, requireActive } = require('../middleware/auth');

router.post('/', protect, requireActive, async (req, res, next) => {
  try {
    const { listingId, reason } = req.body;
    if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: 'Invalid listing.' });
    if (!reason || reason.trim().length < 5) return res.status(400).json({ message: 'Please give a reason (at least 5 characters).' });
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (String(listing.seller) === String(req.user._id)) return res.status(400).json({ message: 'You cannot report your own listing.' });
    await Report.create({ listing: listingId, reporter: req.user._id, reason: reason.trim() });
    res.status(201).json({ message: 'Report submitted. Thank you.' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'You already reported this listing.' });
    next(err);
  }
});
module.exports = router;
