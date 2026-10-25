import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, CATEGORIES } from '../api';

const empty = { title: '', description: '', category: CATEGORIES[0], condition: 'Good', price: '', subject: '', branch: '', semester: '' };

export default function Sell() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const [f, setF] = useState(empty);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (id) api('/listings/' + id).then((d) => setF({ ...empty, ...d.listing })).catch((e) => setError(e.message));
  }, [id]);

  function pickFiles(e) {
    const chosen = Array.from(e.target.files);
    if (chosen.length > 5) return setError('You can upload at most 5 photos.');
    for (const file of chosen) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError('Only JPG, PNG or WEBP images are allowed.');
      if (file.size > 2 * 1024 * 1024) return setError(file.name + ' is larger than 2 MB.');
    }
    setError(''); setFiles(chosen);
  }

  async function submit(e) {
    e.preventDefault(); setError('');
    if (f.title.trim().length < 3) return setError('Title must be at least 3 characters.');
    if (f.description.trim().length < 10) return setError('Description must be at least 10 characters.');
    if (f.price === '' || Number(f.price) < 0) return setError('Enter a valid price.');
    if (!id && files.length === 0) return setError('Please add at least one photo.');
    const form = new FormData();
    ['title', 'description', 'category', 'condition', 'price', 'subject', 'branch', 'semester'].forEach((k) => form.append(k, f[k] ?? ''));
    files.forEach((file) => form.append('images', file));
    setBusy(true);
    try {
      const d = await api(id ? '/listings/' + id : '/listings', { method: id ? 'PUT' : 'POST', form });
      navigate('/item/' + d.listing._id);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  const academic = f.category === 'Books and Textbooks' || f.category === 'Notes and Study Materials';
  return (
    <form className="panel form-box" onSubmit={submit}>
      <h2>{id ? 'Edit Listing' : 'Sell an Item'}</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <label>Item title<input value={f.title} onChange={set('title')} maxLength={100} /></label>
      <label>Description<textarea rows={4} value={f.description} onChange={set('description')} maxLength={1000} /></label>
      <div className="row">
        <label>Category<select value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Condition<select value={f.condition} onChange={set('condition')}><option>New</option><option>Good</option><option>Fair</option></select></label>
        <label>Price (INR)<input type="number" min="0" value={f.price} onChange={set('price')} /></label>
      </div>
      {academic && <div className="row">
        <label>Subject (optional)<input value={f.subject || ''} onChange={set('subject')} /></label>
        <label>Branch (optional)<input value={f.branch || ''} onChange={set('branch')} /></label>
        <label>Semester (optional)<input value={f.semester || ''} onChange={set('semester')} /></label>
      </div>}
      <label>Photos (JPG/PNG/WEBP, max 5, 2 MB each){id && ' - leave empty to keep current photos'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pickFiles} /></label>
      <div className="previews">{files.map((file) => <img key={file.name} src={URL.createObjectURL(file)} alt="preview" />)}</div>
      <button className="btn" disabled={busy}>{busy ? 'Saving...' : id ? 'Save Changes' : 'Post Listing'}</button>
    </form>
  );
}
