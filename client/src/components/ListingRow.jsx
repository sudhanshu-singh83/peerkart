import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, timeAgo } from '../api';
import { useAuth } from '../App';
import Stars from './Stars';
import Thumb from './Thumb';

// One item in the home feed: photo on the left, details in the middle, buttons on the right
export default function ListingRow({ listing }) {
  const { user } = useAuth();
  const [state, setState] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const mine = listing.seller?._id === user.id;
  const r = listing.sellerRating;
  const n = listing.images?.length || 0;

  async function quickRequest() {
    setBusy(true); setState({ type: '', text: '' });
    try { await api('/requests', { method: 'POST', body: { listingId: listing._id } }); setState({ type: 'success', text: 'Request sent' }); }
    catch (e) { setState({ type: 'error', text: e.message }); }
    setBusy(false);
  }
  return (
    <div className="row-card">
      <Link to={'/item/' + listing._id} className="row-thumb"><Thumb listing={listing} />{n > 1 && <span className="count-badge">{n} photos</span>}</Link>
      <div className="row-main">
        <h3><Link to={'/item/' + listing._id}>{listing.title}</Link></h3>
        <p className="price">Rs. {listing.price}</p>
        <p><span className="tag">{listing.category}</span> <span className={'tag cond cond-' + listing.condition.toLowerCase()}>{listing.condition}</span></p>
        <p className="desc">{listing.description}</p>
        <p className="muted">{listing.seller?.name} {r && r.count > 0 && <><Stars value={r.avg} size={13} /> {r.avg}</>} - {timeAgo(listing.createdAt)}</p>
      </div>
      <div className="row-actions">
        <Link to={'/item/' + listing._id} className="btn btn-outline btn-sm">View Details</Link>
        {mine ? <Link to={'/edit/' + listing._id} className="btn btn-outline btn-sm">Edit (your item)</Link>
          : <button className="btn btn-sm" onClick={quickRequest} disabled={busy || state.type === 'success'}>{state.type === 'success' ? 'Requested' : busy ? 'Sending...' : 'Request to Buy'}</button>}
        {state.text && <span className={'mini mini-' + state.type}>{state.text}</span>}
      </div>
    </div>
  );
}
