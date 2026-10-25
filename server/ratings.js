const Review = require('./models/Review');
// Returns { sellerId: { avg, count } } for the given seller ObjectIds.
exports.ratingMap = async (ids) => {
  const rows = await Review.aggregate([
    { $match: { seller: { $in: ids } } },
    { $group: { _id: '$seller', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const map = {};
  rows.forEach((r) => { map[String(r._id)] = { avg: Math.round(r.avg * 10) / 10, count: r.count }; });
  return map;
};
