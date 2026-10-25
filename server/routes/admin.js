const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Report = require('../models/Report');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly); // every admin route needs a logged-in admin

router.get('/stats', async (req, res, next) => {
  try {
    const [users, listings, activeListings, flaggedListings] = await Promise.all([
      User.countDocuments(), Listing.countDocuments(), Listing.countDocuments({ status: 'active' }),
      Report.distinct('listing', { status: 'open' }).then((ids) => ids.length),
    ]);
    res.json({ users, listings, activeListings, flaggedListings });
  } catch (err) { next(err); }
});

router.get('/reports', async (req, res, next) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(200)
      .populate('listing', 'title price status images').populate('reporter', 'name email');
    res.json({ reports });
  } catch (err) { next(err); }
});

router.patch('/reports/:id/resolve', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Report not found.' });
    const report = await Report.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.json({ report });
  } catch (err) { next(err); }
});

// Remove a listing and close every open report about it
router.patch('/listings/:id/remove', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Listing not found.' });
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status: 'removed' }, { new: true });
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    await Report.updateMany({ listing: listing._id, status: 'open' }, { status: 'listing_removed' });
    res.json({ listing });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try { res.json({ users: await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(200) }); } catch (err) { next(err); }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'restricted', 'deactivated'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found.' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Admin accounts cannot be changed here.' });
    user.status = status; await user.save();
    res.json({ message: 'Updated.' });
  } catch (err) { next(err); }
});
module.exports = router;
