import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Stars from '../components/Stars';

// mode "sent" = requests I made, mode "received" = requests for my items
export default function Requests({ mode }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState({ id: null, stars: 5, comment: '' });
  const load = () => { setLoading(true); api('/requests/' + mode).then((d) => setRequests(d.requests)).catch((e) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { setRequests([]); load(); }, [mode]);
  const act = async (fn) => { try { setError(''); await fn(); load(); } catch (e) { setError(e.message); } };
  const answer = (id, status) => act(() => api('/requests/' + id, { method: 'PATCH', body: { status } }));
  const cancel = (id) => act(() => api(`/requests/${id}/cancel`, { method: 'PATCH' }));
  const submitRating = (r) => act(async () => {
    await api('/reviews', { method: 'POST', body: { listingId: r.listing._id, rating: rating.stars, comment: rating.comment } });
    setRating({ id: null, stars: 5, comment: '' });
  });

  return (<>
    <h2>{mode === 'sent' ? 'My Requests' : 'Requests Received'}</h2>
    <p className="muted">{mode === 'sent' ? 'Items you asked to buy. Contact details appear once the seller accepts.' : 'Students who want to buy your items. Accept to share your email with them.'}</p>
    {error && <div className="alert alert-error">{error}</div>}
    {loading && <p className="center-msg">Loading...</p>}
    {!loading && requests.length === 0 && <div className="center-msg">No requests yet. {mode === 'sent' && <Link to="/home">Browse items</Link>}</div>}
    {requests.map((r) => {
      const other = mode === 'sent' ? r.seller : r.buyer;
      return (
        <div className="panel request" key={r._id}>
          <div className="row between">
            <div>
              {r.listing ? <Link to={'/item/' + r.listing._id}><strong>{r.listing.title}</strong></Link> : <strong>Deleted item</strong>}
              {r.listing && <span> - Rs. {r.listing.price}</span>}
              <p className="muted">{mode === 'sent' ? 'Seller' : 'Buyer'}: {other?.name} | {new Date(r.createdAt).toLocaleDateString()}</p>
              {r.message && <p>"{r.message}"</p>}
              {r.status === 'accepted' && other?.email && <p>Contact: <strong>{other.email}</strong></p>}
            </div>
            <span className={'tag tag-' + r.status}>{r.status}</span>
          </div>
          <div className="row">
            {mode === 'received' && r.status === 'pending' && <>
              <button className="btn btn-sm" onClick={() => answer(r._id, 'accepted')}>Accept</button>
              <button className="btn btn-outline btn-sm" onClick={() => answer(r._id, 'declined')}>Decline</button></>}
            {mode === 'sent' && r.status === 'pending' && <button className="btn btn-outline btn-sm" onClick={() => cancel(r._id)}>Cancel request</button>}
            {mode === 'sent' && r.status === 'accepted' && r.listing && (r.reviewed ? <span className="muted">You rated this seller.</span>
              : <button className="btn btn-sm" onClick={() => setRating({ id: r._id, stars: 5, comment: '' })}>Rate seller</button>)}
          </div>
          {rating.id === r._id && (
            <div className="rate-box">
              <Stars value={rating.stars} size={26} onChange={(n) => setRating({ ...rating, stars: n })} />
              <textarea rows={2} maxLength={300} placeholder="Optional comment about the deal" value={rating.comment} onChange={(e) => setRating({ ...rating, comment: e.target.value })} />
              <div className="row"><button className="btn btn-sm" onClick={() => submitRating(r)}>Submit rating</button>
                <button className="btn btn-outline btn-sm" onClick={() => setRating({ id: null, stars: 5, comment: '' })}>Cancel</button></div>
            </div>)}
        </div>);
    })}
  </>);
}
