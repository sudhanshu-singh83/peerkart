import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, CATEGORIES } from '../api';
import { useAuth } from '../App';
import ListingCard from '../components/ListingCard';

// Dashboard shown right after login: a summary of your activity plus the newest items.
// The full search and filter page is "Browse".
export default function Home() {
  const { user } = useAuth();
  const [latest, setLatest] = useState(null);
  const [mine, setMine] = useState([]);
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/listings?sort=newest').then((d) => setLatest(d.listings.filter((l) => l.seller?._id !== user.id).slice(0, 6))).catch((e) => setError(e.message));
    api('/listings/mine').then((d) => setMine(d.listings)).catch(() => {});
    api('/requests/sent').then((d) => setSent(d.requests)).catch(() => {});
    api('/requests/received').then((d) => setReceived(d.requests)).catch(() => {});
  }, []);

  const pending = received.filter((r) => r.status === 'pending');
  const stat = (to, n, label) => <Link to={to} className="panel stat stat-link"><b>{n}</b>{label}</Link>;
  return (<>
    <div className="welcome">
      <h2>Welcome back, {user.name.split(' ')[0]}</h2>
      <p className="muted">Here is what is happening on PeerKart today.</p>
      <div className="row"><Link to="/sell" className="btn">+ Sell an Item</Link><Link to="/browse" className="btn btn-outline">Browse all items</Link></div>
    </div>
    {!user.phone && <div className="alert alert-error">Add your mobile number in your <Link to="/profile">Profile</Link> so buyers and sellers can contact you. Requests need it.</div>}
    {error && <div className="alert alert-error">{error}</div>}

    <div className="grid-4">
      {stat('/my-listings', mine.filter((l) => l.status === 'active').length, 'Active listings')}
      {stat('/requests/received', pending.length, 'Requests waiting for you')}
      {stat('/requests/sent', sent.length, 'Requests you sent')}
      {stat('/my-listings', mine.filter((l) => l.status === 'sold').length, 'Items sold')}
    </div>

    {pending.length > 0 && <div className="panel">
      <div className="row between"><strong>Needs your reply</strong><Link to="/requests/received">See all</Link></div>
      {pending.slice(0, 3).map((r) => <p key={r._id}><strong>{r.buyer?.name}</strong> wants <Link to={'/item/' + r.listing?._id}>{r.listing?.title}</Link>{r.message && <span className="muted"> - "{r.message}"</span>}</p>)}
    </div>}

    <h3>Shop by category</h3>
    <div className="tile-grid">{CATEGORIES.map((c) => <Link key={c} to={'/browse?category=' + encodeURIComponent(c)} className="tile">{c}</Link>)}</div>

    <div className="row between"><h3>Newest from other students</h3><Link to="/browse">See all</Link></div>
    {!latest ? <p className="center-msg">Loading...</p>
      : latest.length === 0 ? <p className="muted">No items from other students yet. Be the first to <Link to="/sell">sell something</Link>.</p>
      : <div className="grid">{latest.map((l) => <ListingCard key={l._id} listing={l} />)}</div>}
  </>);
}
