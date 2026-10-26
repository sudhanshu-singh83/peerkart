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

// Shrinks a photo in the browser before upload (max side 1200px, JPEG). Keeps uploads small and fast.
export function compressImage(file, maxSize = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob ? new File([blob], `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`, { type: 'image/jpeg' }) : file);
      }, 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
