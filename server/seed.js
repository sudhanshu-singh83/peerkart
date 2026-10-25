// Creates an admin, 3 demo students, demo listings, requests and ratings. Run: npm run seed
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Request = require('./models/Request');
const Review = require('./models/Review');
(async () => {
  await mongoose.connect(config.mongoUri);
  const upsert = async (email, name, role, password, extra = {}) =>
    User.findOneAndUpdate({ email }, { name, role, isVerified: true, status: 'active', passwordHash: await bcrypt.hash(password, 10), ...extra }, { upsert: true, new: true });
  const admin = await upsert((process.env.ADMIN_EMAIL || 'admin@glbitm.ac.in').toLowerCase(), 'PeerKart Admin', 'admin', process.env.ADMIN_PASSWORD || 'ChangeMe123');
  const a = await upsert('student1@glbitm.ac.in', 'Aarav Sharma', 'student', 'Student123', { branch: 'CSE', semester: '3', bio: 'Selling my first-year books.' });
  const b = await upsert('student2@glbitm.ac.in', 'Riya Verma', 'student', 'Student123', { branch: 'IT', semester: '5' });
  const c = await upsert('student3@glbitm.ac.in', 'Kabir Singh', 'student', 'Student123', { branch: 'ECE', semester: '1' });
  const ids = [a._id, b._id, c._id];
  await Listing.deleteMany({ seller: { $in: ids } }); await Request.deleteMany({ buyer: { $in: ids } }); await Review.deleteMany({ seller: { $in: ids } });
  const make = (seller, items) => items.map((l) => ({ ...l, seller, images: [], expiresAt: config.semesterEnd }));
  const la = await Listing.insertMany(make(a._id, [
    { title: 'Engineering Mathematics II', description: 'Textbook with light pencil notes, all pages intact.', category: 'Books and Textbooks', condition: 'Good', price: 250, subject: 'Maths', branch: 'CSE', semester: '2' },
    { title: 'Casio fx-991EX Calculator', description: 'Works perfectly, cover included.', category: 'Calculators and Stationery', condition: 'Good', price: 700 },
    { title: 'Hero Sprint Cycle', description: 'Used for one year, new tyres.', category: 'Cycles', condition: 'Fair', price: 2500 },
    { title: 'Data Structures Notes', description: 'Handwritten notes for the full semester.', category: 'Notes and Study Materials', condition: 'Good', price: 120, subject: 'DSA', branch: 'CSE', semester: '3' },
  ]));
  const lb = await Listing.insertMany(make(b._id, [
    { title: 'Table lamp', description: 'LED lamp for hostel desk, 3 brightness levels.', category: 'Hostel Essentials', condition: 'New', price: 300 },
    { title: 'Boat Bluetooth Earphones', description: 'Neckband style, battery lasts a full day.', category: 'Electronics', condition: 'Good', price: 650 },
    { title: 'Physics Textbook (HC Verma)', description: 'Both volumes, no torn pages.', category: 'Books and Textbooks', condition: 'Fair', price: 300, subject: 'Physics', semester: '1' },
  ]));
  await Listing.insertMany(make(c._id, [
    { title: 'Electric kettle 1.5L', description: 'Perfect for hostel rooms.', category: 'Hostel Essentials', condition: 'Good', price: 450 },
    { title: 'Drawing board + set squares', description: 'Used for one semester of engineering graphics.', category: 'Calculators and Stationery', condition: 'Fair', price: 200 },
  ]));
  await Request.create({ listing: la[0]._id, buyer: b._id, seller: a._id, message: 'Can we meet near the library tomorrow?', status: 'accepted' });
  await Review.create({ listing: la[0]._id, seller: a._id, reviewer: b._id, rating: 5, comment: 'Smooth deal, book was as described.' });
  await Request.create({ listing: la[1]._id, buyer: c._id, seller: a._id, message: 'Is the price negotiable?' });
  await Request.create({ listing: lb[0]._id, buyer: a._id, seller: b._id, message: 'I can pick it up from the hostel.' });
  console.log('Seeded. Admin login:', admin.email);
  process.exit(0);
})();
