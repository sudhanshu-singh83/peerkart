const mongoose = require('mongoose');
// A buyer rates a seller after an accepted request. One review per buyer per listing.
const reviewSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 300, default: '' },
}, { timestamps: true });
reviewSchema.index({ listing: 1, reviewer: 1 }, { unique: true });
module.exports = mongoose.model('Review', reviewSchema);
