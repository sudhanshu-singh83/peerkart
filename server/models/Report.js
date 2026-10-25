const mongoose = require('mongoose');
const reportSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, trim: true, minlength: 5, maxlength: 300 },
  status: { type: String, enum: ['open', 'resolved', 'listing_removed'], default: 'open' },
}, { timestamps: true });
reportSchema.index({ listing: 1, reporter: 1 }, { unique: true }); // one report per user per listing
module.exports = mongoose.model('Report', reportSchema);
