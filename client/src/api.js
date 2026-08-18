const BASE = '/api';

async function handle(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const CATEGORIES = [
  'Kantoorbenodigdheden',
  'Huur',
  'Salarissen',
  'Nutsvoorzieningen',
  'Marketing',
  'Reiskosten',
  'Software',
];

export function uploadInvoice(file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetch(`${BASE}/invoices/upload`, { method: 'POST', body: formData }).then(handle);
}

export function listInvoices(month) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return fetch(`${BASE}/invoices${query}`).then(handle);
}

export function updateInvoice(id, fields) {
  return fetch(`${BASE}/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  }).then(handle);
}

export function deleteInvoice(id) {
  return fetch(`${BASE}/invoices/${id}`, { method: 'DELETE' }).then(handle);
}

export function getDashboardSummary(month) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return fetch(`${BASE}/dashboard/summary${query}`).then(handle);
}

export function exportUrl(month) {
  return `${BASE}/export?month=${encodeURIComponent(month)}`;
}
