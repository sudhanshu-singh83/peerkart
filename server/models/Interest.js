const mongoose = require('mongoose');
const s = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
s.index({ listing: 1, student: 1 }, { unique: true });
module.exports = mongoose.model('Interest', s);
