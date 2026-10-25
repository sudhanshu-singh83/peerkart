const router = require('express').Router();
const mongoose = require('mongoose');
const config = require('../config');
const Listing = require('../models/Listing');
const { ratingMap } = require('../ratings');
const { protect, requireActive } = require('../middleware/auth');
const upload = require('../middleware/upload');

const CATEGORIES = Listing.CATEGORIES;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Marks listings past their expiry date as "expired" (called on every read + on a timer).
const expireOldListings = () => Listing.updateMany({ status: 'active', expiresAt: { $lt: new Date() } }, { status: 'expired' });
router.expireOldListings = expireOldListings;

// Checks the form fields; returns an error message or null.
function validate(b) {
  if (!b.title || b.title.trim().length < 3) return 'Title must be at least 3 characters.';
  if (!b.description || b.description.trim().length < 10) return 'Description must be at least 10 characters.';
  if (!CATEGORIES.includes(b.category)) return 'Choose a valid category.';
  if (!['New', 'Good', 'Fair'].includes(b.condition)) return 'Choose a valid condition.';
  const price = Number(b.price);
  if (b.price === '' || Number.isNaN(price) || price < 0 || price > 1000000) return 'Enter a valid price in INR.';
  return null;
}
const pickFields = (b) => ({ title: b.title, description: b.description, category: b.category, condition: b.condition,
  price: Number(b.price), subject: b.subject, branch: b.branch, semester: b.semester });
const badId = (req, res, next) => mongoose.isValidObjectId(req.params.id) ? next() : res.status(404).json({ message: 'Listing not found.' });

// Browse + search + filter (active listings only)
router.get('/', async (req, res, next) => {
  try {
    await expireOldListings();
    const { q, category, minPrice, maxPrice } = req.query;
    const filter = { status: 'active' };
    if (q) { const rx = new RegExp(escapeRegex(String(q).slice(0, 50)), 'i'); filter.$or = [{ title: rx }, { description: rx }, { subject: rx }]; }
    if (category && CATEGORIES.includes(category)) filter.category = category;
    if (['New', 'Good', 'Fair'].includes(req.query.condition)) filter.condition = req.query.condition;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '') filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') filter.price.$lte = Number(maxPrice);
    }
    const sorts = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 } };
    const found = await Listing.find(filter).populate('seller', 'name').sort(sorts[req.query.sort] || sorts.newest).limit(100);
    const ratings = await ratingMap([...new Set(found.map((l) => String(l.seller._id)))].map((id) => new mongoose.Types.ObjectId(id)));
    const listings = found.map((l) => ({ ...l.toObject(), sellerRating: ratings[String(l.seller._id)] || null }));
    res.json({ listings });
  } catch (err) { next(err); }
});

// The logged-in student's own listings, all statuses
router.get('/mine', protect, async (req, res, next) => {
  try {
    await expireOldListings();
    res.json({ listings: await Listing.find({ seller: req.user._id }).sort({ createdAt: -1 }) });
  } catch (err) { next(err); }
});

router.post('/', protect, requireActive, upload.array('images', 5), async (req, res, next) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Upload at least one photo.' });
    if (config.semesterEnd < new Date()) return res.status(400).json({ message: 'The semester has ended. Listings are closed.' });
    const listing = await Listing.create({ ...pickFields(req.body), seller: req.user._id, // seller always comes from the token
      images: req.files.map((f) => '/uploads/' + f.filename), expiresAt: config.semesterEnd });
    res.status(201).json({ listing });
  } catch (err) { next(err); }
});

router.get('/:id', badId, async (req, res, next) => {
  try {
    await expireOldListings();
    const listing = await Listing.findById(req.params.id).populate('seller', 'name isVerified');
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (listing.status !== 'active') { // non-active listings are only visible to the owner
      const auth = req.headers.authorization;
      if (!auth) return res.status(404).json({ message: 'Listing not found.' });
      return protect(req, res, () => {
        if (String(listing.seller._id) !== String(req.user._id) && req.user.role !== 'admin') return res.status(404).json({ message: 'Listing not found.' });
        res.json({ listing });
      });
    }
    res.json({ listing });
  } catch (err) { next(err); }
});

// Finds a listing and makes sure the logged-in user owns it
async function ownListing(req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) { res.status(404).json({ message: 'Listing not found.' }); return null; }
  if (String(listing.seller) !== String(req.user._id)) { res.status(403).json({ message: 'This is not your listing.' }); return null; }
  return listing;
}

router.put('/:id', badId, protect, requireActive, upload.array('images', 5), async (req, res, next) => {
  try {
    const listing = await ownListing(req, res); if (!listing) return;
    if (listing.status !== 'active') return res.status(400).json({ message: 'Only active listings can be edited.' });
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    Object.assign(listing, pickFields(req.body));
    if (req.files && req.files.length) listing.images = req.files.map((f) => '/uploads/' + f.filename);
    await listing.save();
    res.json({ listing });
  } catch (err) { next(err); }
});

router.patch('/:id/sold', badId, protect, async (req, res, next) => {
  try {
    const listing = await ownListing(req, res); if (!listing) return;
    if (listing.status !== 'active') return res.status(400).json({ message: 'Only active listings can be marked sold.' });
    listing.status = 'sold'; await listing.save();
    res.json({ listing });
  } catch (err) { next(err); }
});

router.delete('/:id', badId, protect, async (req, res, next) => {
  try {
    const listing = await ownListing(req, res); if (!listing) return;
    await listing.deleteOne();
    res.json({ message: 'Listing deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
