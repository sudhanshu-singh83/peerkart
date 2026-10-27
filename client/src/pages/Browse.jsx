import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, CATEGORIES } from '../api';
import ListingRow from '../components/ListingRow';

const CONDITIONS = ['', 'New', 'Good', 'Fair'];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const fromUrl = () => ({ q: params.get('q') || '', category: params.get('category') || '', condition: params.get('condition') || '',
    minPrice: params.get('minPrice') || '', maxPrice: params.get('maxPrice') || '', sort: params.get('sort') || 'newest' });
  const [f, setF] = useState(fromUrl());
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const qs = params.toString();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // The address bar is the source of truth: header search, sidebar categories and the filter panel all change it
  useEffect(() => {
    setF(fromUrl()); setLoading(true); setError('');
    api('/listings?' + qs).then((d) => setListings(d.listings)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [qs]);

  const apply = (e) => { if (e) e.preventDefault(); setParams(Object.fromEntries(Object.entries(f).filter(([k, v]) => v !== '' && !(k === 'sort' && v === 'newest')))); };
  const pickCategory = (c) => { const next = Object.fromEntries(params); if (c) next.category = c; else delete next.category; setParams(next); };

  return (<>
    <div className="chips">
      {['', ...CATEGORIES].map((c) => <button key={c} className={'chip' + ((params.get('category') || '') === c ? ' on' : '')} onClick={() => pickCategory(c)}>{c || 'All'}</button>)}
    </div>
    <div className="home-grid">
      <div>
        {loading && <p className="center-msg">Loading items...</p>}
        {error && <div className="alert alert-error">{error}</div>}
        {!loading && !error && <p className="muted">{listings.length} item(s) found</p>}
        {!loading && !error && listings.length === 0 && <div className="center-msg">No items match. Try different filters or <Link to="/sell">sell something</Link>.</div>}
        {listings.map((l) => <ListingRow key={l._id} listing={l} />)}
      </div>
      <form className="panel filter-panel" onSubmit={apply}>
        <div className="row between"><strong>Filters</strong><button type="button" className="btn-link" onClick={() => setParams({})}>Clear all</button></div>
        <label>Search<input placeholder="Title, subject..." value={f.q} onChange={set('q')} /></label>
        <label>Category<select value={f.category} onChange={set('category')}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <p className="muted">Condition</p>
        <div className="chips small">{CONDITIONS.map((c) => <button type="button" key={c} className={'chip' + (f.condition === c ? ' on' : '')} onClick={() => setF({ ...f, condition: c })}>{c || 'All'}</button>)}</div>
        <p className="muted">Price range (Rs.)</p>
        <div className="row"><input type="number" min="0" placeholder="Min" value={f.minPrice} onChange={set('minPrice')} /><input type="number" min="0" placeholder="Max" value={f.maxPrice} onChange={set('maxPrice')} /></div>
        <label>Sort by<select value={f.sort} onChange={set('sort')}><option value="newest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label>
        <button className="btn full">Apply Filters</button>
      </form>
    </div>
  </>);
}
