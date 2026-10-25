import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import Stars from '../components/Stars';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, branch: user.branch || '', semester: user.semester || '', bio: user.bio || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [stats, setStats] = useState({ total: 0, active: 0, sold: 0 });
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    api('/auth/me').then((d) => setUser(d.user)).catch(() => {});
    api('/listings/mine').then((d) => setStats({ total: d.listings.length, active: d.listings.filter((l) => l.status === 'active').length, sold: d.listings.filter((l) => l.status === 'sold').length }));
    api('/users/' + user.id).then((d) => setRating(d.rating)).catch(() => {});
  }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const run = async (fn, ok) => { try { await fn(); setMsg({ type: 'success', text: ok }); } catch (e) { setMsg({ type: 'error', text: e.message }); } };
  const save = () => run(async () => { const d = await api('/profile', { method: 'PUT', body: form }); setUser({ ...user, ...d.user }); setEditing(false); }, 'Profile updated.');
  const changePw = () => run(async () => { await api('/profile/password', { method: 'PUT', body: pw }); setPw({ currentPassword: '', newPassword: '' }); }, 'Password changed.');

  return (<>
    <h2>My Profile</h2>
    {msg.text && <div className={'alert alert-' + msg.type}>{msg.text}</div>}
    <div className="panel">
      <div className="row"><div className="avatar big">{user.name[0]}</div>
        <div><h3>{user.name} <span className="tag tag-active">Verified</span></h3><p className="muted">{user.email}</p>
          <p>{rating.count > 0 ? <><Stars value={rating.avg} /> {rating.avg} ({rating.count} ratings)</> : <span className="muted">No ratings yet</span>}</p></div></div>
      <p>Branch: {user.branch || '-'} | Semester: {user.semester || '-'} | Role: {user.role} | Status: {user.status}</p>
      {user.bio && <p>{user.bio}</p>}
      <p className="muted">Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '...'} | G. L. Bajaj Institute of Technology and Management</p>
      {!editing && <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit profile</button>}
    </div>
    <div className="grid-3">
      <div className="panel stat"><b>{stats.total}</b>Total listings</div>
      <div className="panel stat"><b>{stats.active}</b>Active</div>
      <div className="panel stat"><b>{stats.sold}</b>Sold</div>
    </div>
    {editing && <div className="panel">
      <h3>Edit profile</h3>
      <label>Name<input value={form.name} onChange={set('name')} maxLength={60} /></label>
      <div className="row"><label>Branch<input value={form.branch} onChange={set('branch')} placeholder="e.g. CSE" /></label>
        <label>Semester<input value={form.semester} onChange={set('semester')} placeholder="e.g. 3" /></label></div>
      <label>About you (max 200 characters)<textarea rows={2} maxLength={200} value={form.bio} onChange={set('bio')} /></label>
      <p className="muted">Your college email cannot be changed.</p>
      <div className="row"><button className="btn btn-sm" onClick={save}>Save</button><button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button></div>
    </div>}
    <div className="panel">
      <h3>Change password</h3>
      <div className="row"><label>Current password<input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
        <label>New password (min 8)<input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
        <button className="btn btn-sm" onClick={changePw}>Update</button></div>
    </div>
  </>);
}
