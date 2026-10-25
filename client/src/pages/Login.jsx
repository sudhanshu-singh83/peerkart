import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export default function Login() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [step, setStep] = useState(1); // register steps: 1 email, 2 OTP, 3 password
  const [f, setF] = useState({ name: '', email: '', otp: '', password: '' });
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { login } = useAuth();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  // Runs an API call with loading + error handling
  async function run(fn) {
    setBusy(true); setMsg({ type: '', text: '' });
    try { await fn(); } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setBusy(false);
  }
  const sendOtp = () => run(async () => {
    if (!/^[^\s@]+@glbitm\.ac\.in$/i.test(f.email)) throw new Error('Use your @glbitm.ac.in email.');
    if (f.name.trim().length < 2) throw new Error('Please enter your name.');
    const d = await api('/auth/request-otp', { method: 'POST', body: { name: f.name, email: f.email } });
    setStep(2); setCooldown(60); setMsg({ type: 'success', text: d.message });
  });
  const verifyOtp = () => run(async () => {
    const d = await api('/auth/verify-otp', { method: 'POST', body: { name: f.name, email: f.email, otp: f.otp } });
    setToken(d.registrationToken); setStep(3); setMsg({ type: 'success', text: 'Email verified. Now choose a password.' });
  });
  const register = () => run(async () => {
    const d = await api('/auth/register', { method: 'POST', body: { registrationToken: token, password: f.password } });
    login(d.token, d.user);
  });
  const doLogin = (e) => { e.preventDefault(); run(async () => { const d = await api('/auth/login', { method: 'POST', body: { email: f.email, password: f.password } }); login(d.token, d.user); }); };

  return (
    <div className="auth-box panel">
      <div className="tabs">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMsg({}); }}>Sign In</button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setStep(1); setMsg({}); }}>Register</button>
      </div>
      {msg.text && <div className={'alert alert-' + msg.type}>{msg.text}</div>}

      {mode === 'login' ? (
        <form onSubmit={doLogin}>
          <label>College email<input type="email" value={f.email} onChange={set('email')} placeholder="name@glbitm.ac.in" required /></label>
          <label>Password<input type="password" value={f.password} onChange={set('password')} required /></label>
          <button className="btn" disabled={busy}>{busy ? 'Signing in...' : 'Sign In'}</button>
        </form>
      ) : (
        <div>
          <label>Full name<input value={f.name} onChange={set('name')} disabled={step > 1} /></label>
          <label>College email<input type="email" value={f.email} onChange={set('email')} placeholder="name@glbitm.ac.in" disabled={step > 1} /></label>
          {step === 1 && <button className="btn" disabled={busy} onClick={sendOtp}>{busy ? 'Sending...' : 'Send OTP'}</button>}
          {step === 2 && (<>
            <label>6-digit OTP<input value={f.otp} onChange={set('otp')} maxLength={6} inputMode="numeric" /></label>
            <div className="row"><button className="btn" disabled={busy} onClick={verifyOtp}>Verify OTP</button>
              <button className="btn btn-outline" disabled={busy || cooldown > 0} onClick={sendOtp}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}</button></div>
          </>)}
          {step === 3 && (<>
            <label>Password (min 8 characters)<input type="password" value={f.password} onChange={set('password')} /></label>
            <button className="btn" disabled={busy} onClick={register}>{busy ? 'Creating...' : 'Create Account'}</button>
          </>)}
        </div>
      )}
    </div>
  );
}
