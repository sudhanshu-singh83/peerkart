const multer = require('multer');
const Image = require('../models/Image');
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Files are kept in memory first, then saved into MongoDB by saveToDb().
const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => TYPES.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG or WEBP images are allowed.')),
});
// Saves uploaded files and returns their URLs, e.g. "/api/images/65f..."
upload.saveToDb = async (files, userId) => {
  const docs = await Image.insertMany(files.map((f) => ({ data: f.buffer, contentType: f.mimetype, owner: userId })));
  return docs.map((d) => '/api/images/' + d._id);
};
module.exports = upload;
