const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const listingRoutes = require('./routes/listings');

if (!config.mongoUri || !config.jwtSecret) { console.error('Missing MONGO_URI or JWT_SECRET. Copy .env.example to .env and fill it in.'); process.exit(1); }

const app = express();
app.set('trust proxy', 1); // needed for rate limiting behind Render's proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // lets the Vercel site show images
app.use(cors({ origin: config.clientUrl }));
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', listingRoutes);
app.use('/api/reports', require('./routes/reports'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/images', require('./routes/images'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/users', require('./routes/users'));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found.' }));

// Central error handler: never leaks stack traces
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be under 2 MB.' : 'Upload error: ' + err.message });
  if (err.message && err.message.startsWith('Only JPG')) return res.status(400).json({ message: err.message });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Something went wrong on the server.' });
});

mongoose.connect(config.mongoUri).then(() => {
  console.log('MongoDB connected');
  setInterval(() => listingRoutes.expireOldListings().catch(console.error), 60 * 60 * 1000); // hourly expiry sweep
  app.listen(config.port, () => console.log('PeerKart API running on port ' + config.port));
}).catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
