import { imgUrl } from '../api';
const TINTS = { 'Books and Textbooks': '#e3ecfa', 'Notes and Study Materials': '#e6f3ea', Electronics: '#ece6f7', Cycles: '#fdf0d5', 'Calculators and Stationery': '#fbe6e4', 'Hostel Essentials': '#e0f2f1', Other: '#eceff3' };
// First photo of an item, or a tinted placeholder when it has no photo
export default function Thumb({ listing }) {
  if (listing.images && listing.images[0]) return <img src={imgUrl(listing.images[0])} alt={listing.title} />;
  return <div className="placeholder" style={{ background: TINTS[listing.category] || '#eceff3' }}><b>{(listing.category || '?')[0]}</b><span>{listing.category}</span></div>;
}
