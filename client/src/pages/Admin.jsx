import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = () => Promise.all([api('/admin/stats'), api('/admin/reports'), api('/admin/users')])
    .then(([s, r, u]) => { setStats(s); setReports(r.reports); setUsers(u.users); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const act = async (fn) => { try { await fn(); load(); } catch (e) { setError(e.message); } };

  if (!stats) return error ? <div className="alert alert-error">{error}</div> : <p className="center-msg">Loading...</p>;
  return (<>
    <h2>Admin Dashboard</h2>
    {error && <div className="alert alert-error">{error}</div>}
    <div className="grid-3">
      <div className="panel stat"><b>{stats.users}</b>Total users</div>
      <div className="panel stat"><b>{stats.listings}</b>Total listings</div>
      <div className="panel stat"><b>{stats.flaggedListings}</b>Flagged listings</div>
    </div>
    <h3>Reports</h3>
    <div className="table-wrap"><table>
      <thead><tr><th>Listing</th><th>Reason</th><th>Reported by</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{reports.length === 0 && <tr><td colSpan="5">No reports.</td></tr>}
        {reports.map((r) => (<tr key={r._id}>
          <td>{r.listing ? <Link to={'/item/' + r.listing._id}>{r.listing.title}</Link> : 'Deleted'} {r.listing && <span className={'tag tag-' + r.listing.status}>{r.listing.status}</span>}</td>
          <td>{r.reason}</td><td>{r.reporter?.name}</td><td>{r.status}</td>
          <td>{r.status === 'open' && <div className="row">
            <button className="btn btn-sm btn-outline" onClick={() => act(() => api(`/admin/reports/${r._id}/resolve`, { method: 'PATCH' }))}>Resolve</button>
            {r.listing && <button className="btn btn-sm btn-danger" onClick={() => act(() => api(`/admin/listings/${r.listing._id}/remove`, { method: 'PATCH' }))}>Remove Listing</button>}</div>}</td>
        </tr>))}</tbody></table></div>
    <h3>Users</h3>
    <div className="table-wrap"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Change status</th></tr></thead>
      <tbody>{users.map((u) => (<tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.status}</td>
        <td>{u.role === 'student' && <select value={u.status} onChange={(e) => act(() => api(`/admin/users/${u._id}/status`, { method: 'PATCH', body: { status: e.target.value } }))}>
          <option value="active">active</option><option value="restricted">restricted</option><option value="deactivated">deactivated</option></select>}</td></tr>))}</tbody></table></div>
  </>);
}
