import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, imgUrl } from '../api';
import { useAuth } from '../App';
import Stars from '../components/Stars';

export default function Item() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [rating, setRating] = useState(null);
  const [myReq, setMyReq] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState({ type: '', text: '' });
  const [msg, setMsg] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [photo, setPhoto] = useState(0);

  const loadRequest = () => api('/requests/sent').then((d) => setMyReq(d.requests.find((r) => r.listing?._id === id && r.status !== 'cancelled') || null)).catch(() => {});
  const loadItem = () => api('/listings/' + id).then((d) => {
    setItem(d.listing);
    api('/users/' + d.listing.seller._id).then((u) => setRating(u.rating)).catch(() => {});
  }).catch((e) => setError(e.message));
  useEffect(() => { loadItem(); loadRequest(); }, [id]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!item) return <p className="center-msg">Loading...</p>;

  const isOwner = user.id === item.seller._id;
  async function act(fn, okText) {
    try { const d = await fn(); setNote({ type: 'success', text: okText(d) }); setReporting(false); } catch (e) { setNote({ type: 'error', text: e.message }); }
  }
  const sendRequest = () => act(() => api('/requests', { method: 'POST', body: { listingId: id, message: msg } }).then((d) => { loadRequest(); return d; }), () => 'Request sent. The seller will accept or decline it.');
  const markSold = () => act(() => api(`/listings/${id}/sold`, { method: 'PATCH' }).then((d) => { loadItem(); return d; }), () => 'Marked as sold.');
  const remove = () => window.confirm('Delete this listing?') && api('/listings/' + id, { method: 'DELETE' }).then(() => navigate('/my-listings')).catch((e) => setNote({ type: 'error', text: e.message }));
  const copyLink = () => navigator.clipboard.writeText(window.location.href).then(() => setNote({ type: 'success', text: 'Link copied.' }));

  return (<>
    <p className="muted"><Link to="/home">Browse</Link> / {item.category}</p>
    <div className="detail panel">
      <div className="gallery">
        {item.images.length ? (<>
          <img className="main-photo" src={imgUrl(item.images[photo])} alt={item.title} />
          <div className="thumbs">{item.images.map((src, i) => <img key={src} src={imgUrl(src)} alt="" className={i === photo ? 'on' : ''} onClick={() => setPhoto(i)} />)}</div>
        </>) : <div className="card-img big"><span>No photo</span></div>}
      </div>
      <div>
        <h2>{item.title}</h2>
        <p className="price big">Rs. {item.price}</p>
        <p><span className={'tag tag-' + item.status}>{item.status}</span> Condition: {item.condition}</p>
        <p>{item.description}</p>
        <p className="muted">Category: {item.category}{item.subject && ' | Subject: ' + item.subject}{item.branch && ' | Branch: ' + item.branch}{item.semester && ' | Semester: ' + item.semester}</p>
        <div className="panel seller-box">
          <p className="muted">Seller</p>
          <p><Link to={'/seller/' + item.seller._id}><strong>{item.seller.name}</strong></Link> <span className="tag tag-active">Verified student</span></p>
          {rating && (rating.count > 0 ? <p><Stars value={rating.avg} /> {rating.avg} out of 5 ({rating.count} rating{rating.count > 1 ? 's' : ''})</p> : <p className="muted">No ratings yet</p>)}
        </div>
        <p className="muted">Listed on {new Date(item.createdAt).toLocaleDateString()} - expires {new Date(item.expiresAt).toLocaleDateString()}</p>
        {note.text && <div className={'alert alert-' + note.type}>{note.text}</div>}

        {!isOwner && item.status === 'active' && (myReq ? (
          <div className="panel">
            <p>Your request: <span className={'tag tag-' + myReq.status}>{myReq.status}</span></p>
            {myReq.status === 'accepted' && <p>The seller accepted. Contact them at <strong>{myReq.seller.email}</strong> to meet on campus.</p>}
            {myReq.status === 'pending' && <p className="muted">Waiting for the seller to reply. Track it in My Requests.</p>}
            {myReq.status === 'declined' && <p className="muted">The seller declined this request.</p>}
          </div>
        ) : (
          <div className="panel">
            <label>Request to buy (optional message, max 200 characters)<textarea rows={2} maxLength={200} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Can we meet at the library tomorrow?" /></label>
            <button className="btn" onClick={sendRequest}>Request to Buy</button>
          </div>))}

        <div className="row">
          <button className="btn btn-outline btn-sm" onClick={copyLink}>Copy link</button>
          {!isOwner && <button className="btn btn-outline btn-sm" onClick={() => setReporting(!reporting)}>Report Listing</button>}
          {isOwner && item.status === 'active' && <>
            <Link to={'/edit/' + id} className="btn btn-outline btn-sm">Edit</Link>
            <button className="btn btn-sm" onClick={markSold}>Mark Sold</button></>}
          {isOwner && <button className="btn btn-danger btn-sm" onClick={remove}>Delete</button>}
        </div>
        {reporting && (<div className="panel"><label>Why are you reporting this?<textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          <button className="btn btn-sm" onClick={() => act(() => api('/reports', { method: 'POST', body: { listingId: id, reason } }), (d) => d.message)}>Submit Report</button></div>)}
      </div>
    </div>
  </>);
}
