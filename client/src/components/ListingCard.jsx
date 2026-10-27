import { Link } from 'react-router-dom';
import { imgUrl } from '../api';
import { useAuth } from '../App';
import Stars from './Stars';
import Thumb from './Thumb';

export default function ListingCard({ listing, children }) {
  const { user } = useAuth();
  const mine = listing.seller && (listing.seller._id || listing.seller) === user.id;
  const r = listing.sellerRating;
  return (
    <div className="card">
      <Link to={'/item/' + listing._id} className="card-img">
        <Thumb listing={listing} />
      </Link>
      <div className="card-body">
        <h3>{listing.title}</h3>
        <p className="price">Rs. {listing.price}</p>
        <p className="muted">{listing.condition}{listing.seller?.name ? ' - ' + listing.seller.name : ''}</p>
        {r && r.count > 0 && <p className="muted"><Stars value={r.avg} size={13} /> {r.avg} ({r.count})</p>}
        {mine && <span className="tag">Your listing</span>}
        {listing.status && listing.status !== 'active' && <span className={'tag tag-' + listing.status}>{listing.status}</span>}
        {children || <Link to={'/item/' + listing._id} className="btn btn-outline btn-sm">View Details</Link>}
      </div>
    </div>
  );
}
