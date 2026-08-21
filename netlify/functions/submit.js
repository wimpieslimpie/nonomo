import { getStore } from '@netlify/blobs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }

  // Honeypot: real visitors never fill this hidden field.
  if (data.website) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const name = String(data.name || '').trim().slice(0, 100);
  const location = String(data.location || '').trim().slice(0, 200);
  const email = String(data.email || '').trim().slice(0, 200);
  const notes = String(data.notes || '').trim().slice(0, 1000);

  if (!name || !location || !email) {
    return new Response(JSON.stringify({ error: 'Name, location, and email are required.' }), { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: 'That email address doesn\'t look right.' }), { status: 400 });
  }

  const store = getStore('pledges');
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const record = { id, name, location, email, notes, createdAt: new Date().toISOString() };

  await store.setJSON(id, record);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
