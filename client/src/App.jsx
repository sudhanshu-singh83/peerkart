import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { api } from './api';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';
import Sell from './pages/Sell';
import Item from './pages/Item';
import MyListings from './pages/MyListings';
import Requests from './pages/Requests';
import Profile from './pages/Profile';
import Seller from './pages/Seller';
import Admin from './pages/Admin';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Top bar for visitors who are not logged in
function GuestNav() {
  return (
    <header className="navbar"><div className="container nav-inner">
      <Link to="/" className="brand">Peer<span>Kart</span></Link>
      <nav><Link to="/login">Sign In</Link><Link to="/login?mode=register" className="btn btn-sm">Get Started</Link></nav>
    </div></header>
  );
}

// Left side panel for logged-in users
function Sidebar({ open, close, pending }) {
  const { user, logout } = useAuth();
  const item = (to, label, badge) => (
    <NavLink to={to} onClick={close} className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')}>
      {label}{badge > 0 && <span className="badge">{badge}</span>}
    </NavLink>);
  return (
    <aside className={'sidebar' + (open ? ' open' : '')}>
      <Link to="/home" className="brand side-brand" onClick={close}>Peer<span>Kart</span></Link>
      <Link to="/sell" className="btn side-sell" onClick={close}>+ Sell an Item</Link>
      <nav className="side-nav">
        <p className="side-title">Marketplace</p>
        {item('/home', 'Browse Items')}
        <p className="side-title">My Activity</p>
        {item('/my-listings', 'My Listings')}
        {item('/requests/sent', 'My Requests')}
        {item('/requests/received', 'Requests Received', pending)}
        <p className="side-title">Account</p>
        {item('/profile', 'Profile')}
        {user.role === 'admin' && <>{<p className="side-title">Admin</p>}{item('/admin', 'Dashboard & Reports')}</>}
      </nav>
      <div className="side-user">
        <div className="avatar">{user.name[0]}</div>
        <div className="side-user-info"><strong>{user.name}</strong><span>{user.role}</span></div>
        <button className="btn-link" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}

function Protected({ children, admin }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api('/auth/me').then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);
  // refresh the "Requests Received" badge whenever the page changes
  useEffect(() => { if (user) api('/requests/count').then((d) => setPending(d.count)).catch(() => {}); }, [user, location.pathname]);

  const login = (token, u) => { localStorage.setItem('token', token); setUser(u); navigate(u.role === 'admin' ? '/admin' : '/home'); };
  const logout = () => { api('/auth/logout', { method: 'POST' }).catch(() => {}); localStorage.removeItem('token'); setUser(null); navigate('/'); };

  if (loading) return <p className="center-msg">Loading...</p>;

  const routes = (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Protected><Home /></Protected>} />
      <Route path="/sell" element={<Protected><Sell /></Protected>} />
      <Route path="/edit/:id" element={<Protected><Sell /></Protected>} />
      <Route path="/item/:id" element={<Protected><Item /></Protected>} />
      <Route path="/my-listings" element={<Protected><MyListings /></Protected>} />
      <Route path="/requests/sent" element={<Protected><Requests mode="sent" /></Protected>} />
      <Route path="/requests/received" element={<Protected><Requests mode="received" /></Protected>} />
      <Route path="/seller/:id" element={<Protected><Seller /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
      <Route path="*" element={<p className="center-msg">Page not found.</p>} />
    </Routes>
  );

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {user ? (
        <div className="shell">
          <Sidebar open={menuOpen} close={() => setMenuOpen(false)} pending={pending} />
          {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}
          <div className="content">
            <div className="topbar"><button className="menu-btn" onClick={() => setMenuOpen(true)}>Menu</button><span className="brand">Peer<span>Kart</span></span></div>
            <main className="page">{routes}</main>
          </div>
        </div>
      ) : (<><GuestNav /><main className="container">{routes}</main><footer className="footer">PeerKart - a student mini-project for GLBITM, Greater Noida</footer></>)}
    </AuthContext.Provider>
  );
}
