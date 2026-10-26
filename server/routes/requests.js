const router = require('express').Router();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const Request = require('../models/Request');
const Review = require('../models/Review');
const { protect, requireActive } = require('../middleware/auth');

// Buyer sends a request to buy
router.post('/', protect, requireActive, async (req, res, next) => {
  try {
    const { listingId, message } = req.body;
    if (!req.user.phone) return res.status(400).json({ message: 'Add your mobile number in your Profile first, so the seller can contact you.' });
    if (!mongoose.isValidObjectId(listingId)) return res.status(400).json({ message: 'Invalid listing.' });
    if (message && message.length > 200) return res.status(400).json({ message: 'Message must be under 200 characters.' });
    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'active') return res.status(404).json({ message: 'This item is no longer available.' });
    if (String(listing.seller) === String(req.user._id)) return res.status(400).json({ message: 'You cannot request your own item.' });
    const old = await Request.findOne({ listing: listingId, buyer: req.user._id });
    if (old && old.status !== 'cancelled') return res.status(409).json({ message: 'You already sent a request for this item.' });
    if (old) { old.status = 'pending'; old.message = message || ''; await old.save(); return res.status(201).json({ request: old }); }
    const request = await Request.create({ listing: listingId, buyer: req.user._id, seller: listing.seller, message: message || '' });
    res.status(201).json({ request });
  } catch (err) { next(err); }
});

// Requests I sent. The seller's email is shown only after they accept.
router.get('/sent', protect, async (req, res, next) => {
  try {
    const requests = await Request.find({ buyer: req.user._id }).sort({ createdAt: -1})
      .populate('listing', 'title price images status').populate('seller', 'name email phone');
    const reviewed = new Set((await Review.find({ reviewer: req.user._id }).select('listing')).map((r) => String(r.listing)));
    res.json({ requests: requests.map((r) => {
      const obj = r.toObject();
      if (obj.seller && r.status !== 'accepted') { delete obj.seller.email; delete obj.seller.phone; }
      obj.reviewed = !!obj.listing && reviewed.has(String(obj.listing._id));
      return obj;
    }) });
  } catch (err) { next(err); }
});

// Requests other students sent for my items
router.get('/received', protect, async (req, res, next) => {
  try {
    const requests = await Request.find({ seller: req.user._id, status: { $ne: 'cancelled' } }).sort({ createdAt: -1 })
      .populate('listing', 'title price images status').populate('buyer', 'name email phone');
    res.json({ requests: requests.map((r) => {
      const obj = r.toObject();
      if (obj.buyer && r.status !== 'accepted') { delete obj.buyer.email; delete obj.buyer.phone; }
      return obj;
    }) });
  } catch (err) { next(err); }
});

// Number of pending requests (for the sidebar badge)
router.get('/count', protect, async (req, res, next) => {
  try { res.json({ count: await Request.countDocuments({ seller: req.user._id, status: 'pending' }) }); } catch (err) { next(err); }
});

const validId = (req, res, next) => mongoose.isValidObjectId(req.params.id) ? next() : res.status(404).json({ message: 'Request not found.' });

// Seller accepts or declines
router.patch('/:id', validId, protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ message: 'Status must be accepted or declined.' });
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (String(request.seller) !== String(req.user._id)) return res.status(403).json({ message: 'This is not your request to answer.' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'This request was already answered.' });
    if (status === 'accepted' && !req.user.phone) return res.status(400).json({ message: 'Add your mobile number in your Profile first, so the buyer can contact you.' });
    request.status = status; await request.save();
    res.json({ request });
  } catch (err) { next(err); }
});

// Buyer cancels a pending request
router.patch('/:id/cancel', validId, protect, async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (String(request.buyer) !== String(req.user._id)) return res.status(403).json({ message: 'Not your request.' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be cancelled.' });
    request.status = 'cancelled'; await request.save();
    res.json({ request });
  } catch (err) { next(err); }
});
module.exports = router;
