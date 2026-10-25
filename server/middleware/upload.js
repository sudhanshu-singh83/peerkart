const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
// Local disk storage. To use Cloudinary/S3 later, replace this storage object.
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[file.mimetype]),
});
module.exports = multer({
  storage, limits: { fileSize: 2 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => EXT[file.mimetype] ? cb(null, true) : cb(new Error('Only JPG, PNG or WEBP images are allowed.')),
});
