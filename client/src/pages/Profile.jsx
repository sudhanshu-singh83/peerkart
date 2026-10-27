import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, compressImage, BRANCHES } from '../api';
import { useAuth } from '../App';
import Avatar from '../components/Avatar';
import Stars from '../components/Stars';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', branch: user.branch || '', semester: user.semester || '', bio: user.bio || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [stats, setStats] = useState({ total: 0, active: 0, sold: 0 });
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    api('/auth/me').then((d) => setUser(d.user)).catch(() => {});
    api('/listings/mine').then((d) => setStats({ total: d.listings.length, active: d.listings.filter((l) => l.status === 'active').length, sold: d.listings.filter((l) => l.status === 'sold').length })).catch(() => {});
    api('/users/' + user.id).then((d) => setRating(d.rating)).catch(() => {});
  }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const run = async (fn, ok) => { setMsg({ type: '', text: '' }); try { await fn(); setMsg({ type: 'success', text: ok }); } catch (e) { setMsg({ type: 'error', text: e.message }); } };

  const save = () => run(async () => { const d = await api('/profile', { method: 'PUT', body: form }); setUser({ ...user, ...d.user }); setTab('overview'); }, 'Profile updated.');
  const changePw = () => run(async () => { await api('/profile/password', { method: 'PUT', body: pw }); setPw({ currentPassword: '', newPassword: '' }); }, 'Password changed.');
  const changePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    run(async () => { const fd = new FormData(); fd.append('avatar', await compressImage(file, 400)); const d = await api('/profile/avatar', { method: 'PUT', form: fd }); setUser({ ...user, ...d.user }); }, 'Profile photo updated.');
  };
  const removePhoto = () => run(async () => { const d = await api('/profile/avatar', { method: 'DELETE' }); setUser({ ...user, ...d.user }); }, 'Profile photo removed.');

  const info = (label, value) => <div className="info-item"><span className="muted">{label}</span><strong>{value || '-'}</strong></div>;
  return (<>
    <div className="panel profile-head">
      <Avatar user={user} size={84} />
      <div className="profile-title">
        <h2>{user.name}</h2>
        <p><span className="tag tag-active">Verified student</span> <span className="tag">{user.role}</span></p>
        <p>{rating.count > 0 ? <><Stars value={rating.avg} size={18} /> {rating.avg} ({rating.count} rating{rating.count > 1 ? 's' : ''})</> : <span className="muted">No ratings yet</span>}</p>
      </div>
      <div className="grid-3 profile-stats">
        <div className="stat"><b>{stats.total}</b>Listings</div><div className="stat"><b>{stats.active}</b>Active</div><div className="stat"><b>{stats.sold}</b>Sold</div>
      </div>
    </div>
    {!user.phone && <div className="alert alert-error">Add your mobile number in Edit Profile, so buyers and sellers can contact you. Requests need it.</div>}
    {msg.text && <div className={'alert alert-' + msg.type}>{msg.text}</div>}
    <div className="tabs wide">
      {[['overview', 'Overview'], ['edit', 'Edit Profile'], ['security', 'Security']].map(([k, label]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}</button>)}
    </div>

    {tab === 'overview' && <div className="panel">
      <div className="info-grid">
        {info('College email', user.email)}{info('Mobile number', user.phone)}{info('Branch', user.branch)}{info('Semester', user.semester)}
        {info('Account status', user.status)}{info('Member since', user.createdAt && new Date(user.createdAt).toLocaleDateString())}
      </div>
      {user.bio && <><p className="muted">About</p><p>{user.bio}</p></>}
      <p className="muted">G. L. Bajaj Institute of Technology and Management, Greater Noida</p>
      <div className="row"><Link to="/my-listings" className="btn btn-outline btn-sm">My Listings</Link><Link to="/requests/sent" className="btn btn-outline btn-sm">My Requests</Link><Link to="/requests/received" className="btn btn-outline btn-sm">Requests Received</Link></div>
    </div>}

    {tab === 'edit' && <div className="panel">
      <h3>Profile photo</h3>
      <div className="row"><Avatar user={user} size={64} />
        <label className="btn btn-outline btn-sm file-btn">Change photo<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={changePhoto} /></label>
        {user.avatar && <button className="btn btn-outline btn-sm" onClick={removePhoto}>Remove photo</button>}</div>
      <h3>Details</h3>
      <div className="row"><label>Name<input value={form.name} onChange={set('name')} maxLength={60} /></label>
        <label>Mobile number (10 digits)<input value={form.phone} onChange={set('phone')} maxLength={10} inputMode="numeric" /></label></div>
      <div className="row">
        <label>Branch<select value={form.branch} onChange={set('branch')}><option value="">Select</option>{BRANCHES.map((b) => <option key={b}>{b}</option>)}</select></label>
        <label>Semester<select value={form.semester} onChange={set('semester')}><option value="">Select</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></label></div>
      <label>About you (max 200 characters)<textarea rows={2} maxLength={200} value={form.bio} onChange={set('bio')} /></label>
      <p className="muted">Your college email cannot be changed.</p>
      <button className="btn btn-sm" onClick={save}>Save changes</button>
    </div>}

    {tab === 'security' && <div className="panel">
      <h3>Change password</h3>
      <div className="row"><label>Current password<input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
        <label>New password (min 8)<input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label></div>
      <button className="btn btn-sm" onClick={changePw}>Update password</button>
    </div>}
  </>);
}
