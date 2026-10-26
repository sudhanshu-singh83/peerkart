const router = require('express').Router();
const mongoose = require('mongoose');
const Image = require('../models/Image');
// Public so <img> tags work. The id is a long random value, so it cannot be guessed.
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
    const img = await Image.findById(req.params.id);
    if (!img) return res.status(404).end();
    res.set('Content-Type', img.contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(img.data);
  } catch (err) { next(err); }
});
module.exports = router;
