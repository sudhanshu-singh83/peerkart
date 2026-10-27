import { useEffect, useState, createContext, useContext } from 'react';
import { Routes, Route, Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { api, CATEGORIES } from './api';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Sell from './pages/Sell';
import Item from './pages/Item';
import MyListings from './pages/MyListings';
import Requests from './pages/Requests';
import Profile from './pages/Profile';
import Seller from './pages/Seller';
import Admin from './pages/Admin';
import Avatar from './components/Avatar';

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

// Top bar for logged-in users: menu button, logo, search, Sell button, bell, account menu
function Header({ onMenu, pending }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const search = (e) => { e.preventDefault(); navigate('/browse?q=' + encodeURIComponent(q)); };
  return (
    <header className="appbar">
      <button className="icon-btn" onClick={onMenu} title="Show or hide the menu">&#9776;</button>
      <Link to="/home" className="brand">Peer<span>Kart</span></Link>
      <form className="appbar-search" onSubmit={search}><input placeholder="Search for items, subjects..." value={q} onChange={(e) => setQ(e.target.value)} /></form>
      <div className="appbar-actions">
        <Link to="/sell" className="btn btn-sm">+ Sell an Item</Link>
        <Link to="/requests/received" className="bell" title="Requests received">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          {pending > 0 && <span className="badge">{pending}</span>}
        </Link>
        <div className="menu-wrap">
          <button className="avatar-btn" onClick={() => setOpen(!open)}><Avatar user={user} size={34} /><span>&#9662;</span></button>
          {open && <>
            <div className="menu-overlay" onClick={() => setOpen(false)} />
            <div className="dropdown" onClick={() => setOpen(false)}>
              <div className="dropdown-head"><strong>{user.name}</strong><span>{user.email}</span></div>
              <Link to="/profile">My Profile</Link><Link to="/my-listings">My Listings</Link><Link to="/requests/sent">My Requests</Link>
              {user.role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
              <button onClick={logout}>Logout</button>
            </div>
          </>}
        </div>
      </div>
    </header>
  );
}

function Sidebar({ open, close, pending }) {
  const { user } = useAuth();
  const loc = useLocation();
  const onBrowse = loc.pathname === '/browse';
  const hasCat = onBrowse && loc.search.includes('category=');
  const item = (to, label, badge) => (
    <NavLink to={to} onClick={close} className={({ isActive }) => 'side-link' + (isActive ? ' active' : '')}>
      {label}{badge > 0 && <span className="badge">{badge}</span>}
    </NavLink>);
  return (
    <aside className={'sidebar' + (open ? ' open' : '')}>
      <nav className="side-nav">
        <p className="side-title">Marketplace</p>
        {item('/home', 'Home')}
        <Link to="/browse" onClick={close} className={'side-link' + (onBrowse && !hasCat ? ' active' : '')}>Browse Items</Link>
        {item('/sell', 'Sell an Item')}
        <p className="side-title">My Activity</p>
        {item('/my-listings', 'My Listings')}
        {item('/requests/sent', 'My Requests')}
        {item('/requests/received', 'Requests Received', pending)}
        <p className="side-title">Categories</p>
        {CATEGORIES.map((c) => <Link key={c} to={'/browse?category=' + encodeURIComponent(c)} onClick={close}
          className={'side-link' + (onBrowse && loc.search.includes('category=' + encodeURIComponent(c)) ? ' active' : '')}>{c}</Link>)}
        <p className="side-title">Account</p>
        {item('/profile', 'Profile')}
        {user.role === 'admin' && item('/admin', 'Admin Dashboard')}
      </nav>
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
  const [collapsed, setCollapsed] = useState(localStorage.getItem('sidebar') === 'closed');
  const [pending, setPending] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api('/auth/me').then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);
  // refresh the bell / "Requests Received" badge whenever the page changes
  useEffect(() => { if (user) api('/requests/count').then((d) => setPending(d.count)).catch(() => {}); }, [user, location.pathname]);

  // Phones: open the slide-in menu. Computers: hide or show the sidebar (remembered).
  const toggleSidebar = () => {
    if (window.innerWidth <= 860) return setMenuOpen(!menuOpen);
    localStorage.setItem('sidebar', collapsed ? 'open' : 'closed'); setCollapsed(!collapsed);
  };
  const login = (token, u) => { localStorage.setItem('token', token); setUser(u); navigate(u.role === 'admin' ? '/admin' : '/home'); };
  const logout = () => { api('/auth/logout', { method: 'POST' }).catch(() => {}); localStorage.removeItem('token'); setUser(null); navigate('/'); };

  if (loading) return <p className="center-msg">Loading...</p>;

  const routes = (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Protected><Home /></Protected>} />
      <Route path="/browse" element={<Protected><Browse /></Protected>} />
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
        <div className={'app' + (collapsed ? ' collapsed' : '')}>
          <Header onMenu={toggleSidebar} pending={pending} />
          <div className="shell">
            <Sidebar open={menuOpen} close={() => setMenuOpen(false)} pending={pending} />
            {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}
            <main className="page">{routes}</main>
          </div>
        </div>
      ) : (<><GuestNav /><main className="container">{routes}</main><footer className="footer">PeerKart - a student mini-project for GLBITM, Greater Noida</footer></>)}
    </AuthContext.Provider>
  );
}
