import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

const BRANCHES = ['CSE', 'CSE (AI/ML)', 'CSE (Data Science)', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'MCA', 'MBA', 'Other'];

export default function Login() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [step, setStep] = useState(1); // register steps: 1 email, 2 OTP, 3 password
  const [f, setF] = useState({ name: '', email: '', otp: '', password: '', phone: '', branch: '', semester: '' });
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
    setToken(d.registrationToken); setStep(3); setMsg({ type: 'success', text: 'Email verified. Now complete your student details.' });
  });
  const register = () => run(async () => {
    if (!/^[6-9]\d{9}$/.test(f.phone)) throw new Error('Enter a valid 10-digit mobile number.');
    if (!f.branch || !f.semester) throw new Error('Please select your branch and semester.');
    if (f.password.length < 8) throw new Error('Password must be at least 8 characters.');
    const d = await api('/auth/register', { method: 'POST', body: { registrationToken: token, password: f.password, phone: f.phone, branch: f.branch, semester: f.semester } });
    login(d.token, d.user);
  });
  const sendReset = () => run(async () => {
    if (!/^[^\s@]+@glbitm\.ac\.in$/i.test(f.email)) throw new Error('Use your @glbitm.ac.in email.');
    const d = await api('/auth/forgot-password', { method: 'POST', body: { email: f.email } });
    setStep(2); setCooldown(60); setMsg({ type: 'success', text: d.message });
  });
  const doReset = () => run(async () => {
    if (f.password.length < 8) throw new Error('Password must be at least 8 characters.');
    await api('/auth/reset-password', { method: 'POST', body: { email: f.email, otp: f.otp, newPassword: f.password } });
    setMode('login'); setStep(1); setF({ ...f, otp: '', password: '' }); setMsg({ type: 'success', text: 'Password changed. Please sign in.' });
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
          <p><button type="button" className="btn-link" onClick={() => { setMode('forgot'); setStep(1); setMsg({}); }}>Forgot password?</button></p>
        </form>
      ) : mode === 'forgot' ? (
        <div>
          <p className="muted">Enter your college email. We will send a 6-digit OTP to reset your password.</p>
          <label>College email<input type="email" value={f.email} onChange={set('email')} placeholder="name@glbitm.ac.in" disabled={step > 1} /></label>
          {step === 1 && <button className="btn" disabled={busy} onClick={sendReset}>{busy ? 'Sending...' : 'Send OTP'}</button>}
          {step === 2 && (<>
            <label>6-digit OTP<input value={f.otp} onChange={set('otp')} maxLength={6} inputMode="numeric" /></label>
            <label>New password (min 8 characters)<input type="password" value={f.password} onChange={set('password')} /></label>
            <div className="row"><button className="btn" disabled={busy} onClick={doReset}>Reset password</button>
              <button className="btn btn-outline" disabled={busy || cooldown > 0} onClick={sendReset}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}</button></div>
          </>)}
          <p><button type="button" className="btn-link" onClick={() => { setMode('login'); setStep(1); setMsg({}); }}>Back to Sign In</button></p>
        </div>
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
            <label>Mobile number (10 digits)<input value={f.phone} onChange={set('phone')} maxLength={10} inputMode="numeric" placeholder="e.g. 9876543210" /></label>
            <div className="row">
              <label>Branch<select value={f.branch} onChange={set('branch')}><option value="">Select</option>{BRANCHES.map((b) => <option key={b}>{b}</option>)}</select></label>
              <label>Semester<select value={f.semester} onChange={set('semester')}><option value="">Select</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></label>
            </div>
            <label>Password (min 8 characters)<input type="password" value={f.password} onChange={set('password')} /></label>
            <p className="muted">Your mobile number is shown only to a student whose buy request you accept (or who accepts yours).</p>
            <button className="btn" disabled={busy} onClick={register}>{busy ? 'Creating...' : 'Create Account'}</button>
          </>)}
        </div>
      )}
    </div>
  );
}
