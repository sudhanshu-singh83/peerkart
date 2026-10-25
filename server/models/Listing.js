const mongoose = require('mongoose');
const CATEGORIES = ['Books and Textbooks', 'Notes and Study Materials', 'Electronics', 'Cycles', 'Calculators and Stationery', 'Hostel Essentials', 'Other'];
const listingSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  category: { type: String, enum: CATEGORIES, required: true },
  condition: { type: String, enum: ['New', 'Good', 'Fair'], required: true },
  price: { type: Number, required: true, min: 0, max: 1000000 },
  images: [String],
  subject: { type: String, trim: true }, branch: { type: String, trim: true }, semester: { type: String, trim: true },
  status: { type: String, enum: ['active', 'sold', 'expired', 'removed'], default: 'active' },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
listingSchema.index({ status: 1, category: 1, price: 1 });
listingSchema.index({ status: 1, expiresAt: 1 });
module.exports = mongoose.model('Listing', listingSchema);
module.exports.CATEGORIES = CATEGORIES;
