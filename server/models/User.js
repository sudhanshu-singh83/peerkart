const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  status: { type: String, enum: ['active', 'restricted', 'deactivated'], default: 'active' },
  branch: { type: String, trim: true, maxlength: 40, default: '' },
  semester: { type: String, trim: true, maxlength: 10, default: '' },
  bio: { type: String, trim: true, maxlength: 200, default: '' },
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
