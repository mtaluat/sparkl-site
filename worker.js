// Sparkl – ONE Cloudflare Worker: serves the website (public/) and answers GET /api/track?id=...
// Secrets: SHIPMENTS_CSV, EVENTS_CSV.  Optional: LEGACY_TRACK_URL (an older AWB API that returns
// {awb_number,status,location,estimated_delivery,network_partner,timeline:[{time,event}]} for ?awb=...)
function parseCSV(t) {
  t = t.replace(/^\uFEFF/, '');
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f); rows.push(r); r = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  const [h = [], ...b] = rows;
  return b.filter(x => x.some(v => v.trim())).map(x => Object.fromEntries(h.map((k, i) => [k.trim(), (x[i] || '').trim()])));
}
const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const load = async u => {
  const r = await fetch(u, { cf: { cacheTtl: 30, cacheEverything: true } });
  if (!r.ok) throw new Error('csv ' + r.status);
  return parseCSV(await r.text());
};
const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': s === 200 ? 'public, max-age=30' : 'no-store' }
});

async function sparkl(id, env) {
  const [S, E] = await Promise.all([load(env.SHIPMENTS_CSV), load(env.EVENTS_CSV)]);
  const s = S.find(x => norm(x.tracking_id) === id);
  if (!s) return null;
  const events = E.filter(x => norm(x.tracking_id) === id).reverse()
    .map(x => ({ time: x.time, status: x.status, location: x.location, note: x.note }));
  return { id: s.tracking_id, status: s.status, origin: s.origin, destination: s.destination, consignee: s.consignee, eta: s.eta, location: s.current_location, updated: s.updated_at, events };
}

async function legacy(awb, env) {
  if (!env.LEGACY_TRACK_URL) return null;
  try {
    const u = new URL(env.LEGACY_TRACK_URL); u.searchParams.set('awb', awb);
    const r = await fetch(u, { cf: { cacheTtl: 30, cacheEverything: true } });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d || d.error) return null;
    return { id: d.awb_number || awb, status: d.status || 'In transit', location: d.location || '', eta: d.estimated_delivery || '', partner: d.network_partner || '',
      events: (Array.isArray(d.timeline) ? d.timeline : []).map(t => ({ time: t.time || '', status: t.event || '', location: '', note: '' })) };
  } catch (e) { return null; }
}

async function track(request, env) {
  const id = norm(new URL(request.url).searchParams.get('id'));
  if (!id || id.length > 40) return json({ error: 'Invalid tracking number' }, 400);
  try {
    const d = /^SPK\d{10}$/.test(id) ? await sparkl(id, env) : await legacy(id, env);
    return d ? json(d) : json({ error: 'Not found' }, 404);
  } catch (e) { return json({ error: 'Database unavailable' }, 502); }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/track' && request.method === 'GET') return track(request, env);
    if (pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    return env.ASSETS.fetch(request); // the website (public/)
  }
};
