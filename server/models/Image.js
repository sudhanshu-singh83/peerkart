const mongoose = require('mongoose');
// Photos are stored in MongoDB so they are never lost when the server restarts.
const imageSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Image', imageSchema);
