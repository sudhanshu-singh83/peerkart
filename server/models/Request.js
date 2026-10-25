const mongoose = require('mongoose');
// A buyer's "request to buy" for one listing. The seller accepts or declines it.
const requestSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, trim: true, maxlength: 200, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending' },
}, { timestamps: true });
requestSchema.index({ listing: 1, buyer: 1 }, { unique: true });
module.exports = mongoose.model('Request', requestSchema);
