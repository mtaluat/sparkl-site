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
const STATUS = { outofdelivery: 'Out for delivery', outfordelivery: 'Out for delivery', pickedup: 'Picked up', athub: 'At hub', intransit: 'In transit', delivered: 'Delivered' };
const status = s => STATUS[String(s || '').toLowerCase().replace(/[^a-z]/g, '')] || s;
const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
// Accepts the web-page link by mistake too: .../pubhtml?gid=1 becomes .../pub?gid=1&output=csv
const csvUrl = u => {
  u = String(u || '').trim();
  try {
    const x = new URL(u);
    if (x.hostname === 'docs.google.com') {
      x.pathname = x.pathname.replace(/\/pubhtml$/, '/pub');
      if (/\/pub$/.test(x.pathname)) x.searchParams.set('output', 'csv');
    }
    return x.toString();
  } catch (e) { return u; }
};
const load = async u => {
  const r = await fetch(csvUrl(u), { cf: { cacheTtl: 30, cacheEverything: true } });
  if (!r.ok) throw new Error('csv ' + r.status);
  const t = await r.text();
  if (/^\s*</.test(t)) throw new Error('not csv (got a web page)');
  return parseCSV(t);
};
const json = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': s === 200 ? 'public, max-age=30' : 'no-store', 'Access-Control-Allow-Origin': '*' }
});

async function sparkl(id, env) {
  const [S, E] = await Promise.all([load(env.SHIPMENTS_CSV), load(env.EVENTS_CSV)]);
  const s = S.find(x => norm(x.tracking_id) === id);
  if (!s) return null;
  const events = E.filter(x => norm(x.tracking_id) === id).reverse()
    .map(x => ({ time: x.time, status: status(x.status), location: x.location, note: x.note }));
  return { id: s.tracking_id, status: status(s.status), origin: s.origin, destination: s.destination, consignee: s.consignee, eta: s.eta, location: s.current_location, updated: s.updated_at, events };
}

// Pincode coverage. Source: the "Coverage" sheet tab (published CSV in COVERAGE_CSV: pincode, area, service, active).
// Until COVERAGE_CSV is set, this built-in list is used.
const DEFAULT_PINS = ['192303', '192304', '192305'];
async function coverage(request, env) {
  const pin = String(new URL(request.url).searchParams.get('pin') || '').replace(/\D/g, '');
  if (!/^\d{6}$/.test(pin)) return json({ error: 'Invalid pincode' }, 400);
  try {
    if (!env.COVERAGE_CSV) { const c = DEFAULT_PINS.includes(pin); return json({ pin, covered: c, area: '', service: c ? 'Standard & Express' : '' }); }
    const rows = await load(env.COVERAGE_CSV);
    if (rows.length && !('pincode' in rows[0])) return json({ error: 'Coverage source has no pincode column' }, 502);
    const row = rows.find(x => String(x.pincode || '').replace(/\D/g, '') === pin);
    const on = !!row && !/^(no|n|false|0|inactive|off)$/i.test(String(row.active || 'yes').trim());
    return json({ pin, covered: on, area: on ? row.area || '' : '', service: on ? row.service || 'Standard & Express' : '' });
  } catch (e) { return json({ error: 'Coverage unavailable' }, 502); }
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
    if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*' } });
    if (pathname === '/api/health') {
      const o = { ok: true, shipments_csv: !!env.SHIPMENTS_CSV, events_csv: !!env.EVENTS_CSV, legacy: !!env.LEGACY_TRACK_URL, coverage_csv: !!env.COVERAGE_CSV };
      if (new URL(request.url).searchParams.get('deep')) { // ?deep=1 reports row counts and column names only, never the data
        const probe = async u => { if (!u) return { error: 'not set' }; try { const r = await load(u); return { rows: r.length, columns: Object.keys(r[0] || {}) }; } catch (e) { return { error: String(e.message || e) }; } };
        o.deep = { shipments: await probe(env.SHIPMENTS_CSV), events: await probe(env.EVENTS_CSV), coverage: await probe(env.COVERAGE_CSV) };
      }
      return json(o, 200);
    }
    if (pathname === '/api/track' && request.method === 'GET') return track(request, env);
    if (pathname === '/api/coverage' && request.method === 'GET') return coverage(request, env);
    if (pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    const res = await env.ASSETS.fetch(request); // the website (public/)
    if (res.status === 404 && request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html')) {
      const nf = await env.ASSETS.fetch(new Request(new URL('/404', request.url)));
      if (nf.ok) return new Response(nf.body, { status: 404, headers: nf.headers });
    }
    return res;
  }
};
