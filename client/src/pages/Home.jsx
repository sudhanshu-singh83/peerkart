import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, CATEGORIES } from '../api';
import ListingCard from '../components/ListingCard';

const blank = { q: '', category: '', condition: '', minPrice: '', maxPrice: '', sort: 'newest' };

export default function Home() {
  const [filters, setFilters] = useState(blank);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  function load(f = filters) {
    setLoading(true); setError('');
    const params = new URLSearchParams(Object.entries(f).filter(([, v]) => v !== ''));
    api('/listings?' + params).then((d) => setListings(d.listings)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);
  const clear = () => { setFilters(blank); load(blank); };

  return (<>
    <h2>Browse Items</h2>
    <p className="muted">Items listed by students of GLBITM. Open an item and send a request to buy.</p>
    <form className="filters panel" onSubmit={(e) => { e.preventDefault(); load(); }}>
      <input placeholder="Search by title, subject..." value={filters.q} onChange={set('q')} />
      <select value={filters.category} onChange={set('category')}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      <select value={filters.condition} onChange={set('condition')}><option value="">Any condition</option><option>New</option><option>Good</option><option>Fair</option></select>
      <input type="number" min="0" placeholder="Min Rs." value={filters.minPrice} onChange={set('minPrice')} />
      <input type="number" min="0" placeholder="Max Rs." value={filters.maxPrice} onChange={set('maxPrice')} />
      <select value={filters.sort} onChange={set('sort')}><option value="newest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
      <div className="row"><button className="btn">Search</button><button type="button" className="btn btn-outline" onClick={clear}>Clear</button></div>
    </form>
    {loading && <p className="center-msg">Loading items...</p>}
    {error && <div className="alert alert-error">{error}</div>}
    {!loading && !error && <p className="muted">{listings.length} item(s) found</p>}
    {!loading && !error && listings.length === 0 && <div className="center-msg">No items match. Try different filters or <Link to="/sell">sell something</Link>.</div>}
    <div className="grid">{listings.map((l) => <ListingCard key={l._id} listing={l} />)}</div>
  </>);
}
