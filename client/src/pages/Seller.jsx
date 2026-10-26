import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import Stars from '../components/Stars';
import Avatar from '../components/Avatar';
import ListingCard from '../components/ListingCard';

// Public page of a seller: rating, reviews and their active items
export default function Seller() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/users/' + id).then(setData).catch((e) => setError(e.message)); }, [id]);
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <p className="center-msg">Loading...</p>;
  const { user, rating, reviews, listings, soldCount } = data;
  return (<>
    <div className="panel">
      <div className="row"><Avatar user={user} size={64} />
        <div><h2>{user.name} <span className="tag tag-active">Verified student</span></h2>
          <p className="muted">{[user.branch, user.semester && 'Semester ' + user.semester].filter(Boolean).join(' | ') || 'GLBITM student'} | Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          {user.bio && <p>{user.bio}</p>}</div></div>
      <p>{rating.count > 0 ? <><Stars value={rating.avg} size={20} /> <strong>{rating.avg}</strong> out of 5 from {rating.count} rating{rating.count > 1 ? 's' : ''}</> : 'No ratings yet'} | {soldCount} item(s) sold</p>
    </div>
    <h3>Reviews</h3>
    {reviews.length === 0 ? <p className="muted">No reviews yet.</p> : reviews.map((r) => (
      <div className="panel" key={r._id}><Stars value={r.rating} /> <strong>{r.reviewer?.name}</strong>
        <span className="muted"> on "{r.listing?.title}" - {new Date(r.createdAt).toLocaleDateString()}</span>{r.comment && <p>{r.comment}</p>}</div>))}
    <h3>Items for sale ({listings.length})</h3>
    <div className="grid">{listings.map((l) => <ListingCard key={l._id} listing={{ ...l, seller: { _id: user._id, name: user.name } }} />)}</div>
  </>);
}
