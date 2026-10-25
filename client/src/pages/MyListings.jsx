import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ListingCard from '../components/ListingCard';

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');
  const load = () => api('/listings/mine').then((d) => setListings(d.listings)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  async function act(fn) { try { await fn(); load(); } catch (e) { setError(e.message); } }
  const del = (id) => window.confirm('Delete this listing permanently?') && act(() => api('/listings/' + id, { method: 'DELETE' }));
  const sold = (id) => act(() => api(`/listings/${id}/sold`, { method: 'PATCH' }));

  const section = (title, list) => (<>
    <h3>{title} ({list.length})</h3>
    {list.length === 0 ? <p className="muted">Nothing here yet.</p> : <div className="grid">{list.map((l) => (
      <ListingCard key={l._id} listing={l}>
        <div className="row">
          <Link to={'/item/' + l._id} className="btn btn-outline btn-sm">View</Link>
          {l.status === 'active' && <><Link to={'/edit/' + l._id} className="btn btn-outline btn-sm">Edit</Link>
            <button className="btn btn-sm" onClick={() => sold(l._id)}>Mark Sold</button></>}
          <button className="btn btn-danger btn-sm" onClick={() => del(l._id)}>Delete</button>
        </div>
      </ListingCard>))}</div>}
  </>);
  return (<>
    <div className="row between"><h2>My Listings</h2><Link to="/sell" className="btn">+ Sell an Item</Link></div>
    {error && <div className="alert alert-error">{error}</div>}
    {section('Active', listings.filter((l) => l.status === 'active'))}
    {section('Sold', listings.filter((l) => l.status === 'sold'))}
    {section('Expired / removed (history)', listings.filter((l) => ['expired', 'removed'].includes(l.status)))}
  </>);
}
