const API = import.meta.env.VITE_API_URL as string;

export async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init
  });
  if (!res.ok) {
    let detail: any = null;
    try { detail = await res.json(); } catch {}
    throw new Error(detail?.error || `HTTP ${res.status}`);
  }
  return res.json();
}
