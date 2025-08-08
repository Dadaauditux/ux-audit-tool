// frontend/src/api.js

// 1) Read the API base from env (Vercel) or fall back to Render URL
const API_BASE =
  import.meta?.env?.VITE_API_BASE || 'https://ux-audit-tool.onrender.com';

// 2) Upload image to the correct backend endpoint
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/api/audit/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} – ${text || 'Erreur lors de l’analyse'}`);
  }

  return res.json();
}
