// Small wrapper around fetch(). In production set VITE_API_URL to the Render backend URL.
export const API = import.meta.env.VITE_API_URL || '';
export const imgUrl = (path) => (path ? API + path : '');
export const CATEGORIES = ['Books and Textbooks', 'Notes and Study Materials', 'Electronics', 'Cycles', 'Calculators and Stationery', 'Hostel Essentials', 'Other'];

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(API + '/api' + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  } catch { throw new Error('Cannot reach the server. Check your internet connection.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}
