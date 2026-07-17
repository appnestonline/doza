/**
 * Doza - anonymous shared medication-course log.
 *
 * Zero-dependency Node.js server:
 *   - random tracker links (security by obscurity), valid 10 days after last activity
 *   - JSON-file storage (atomic writes), expired trackers purged hourly
 *   - in-memory per-IP rate limiting (no accounts, no cookies)
 *
 * Run:  node server.js   (PORT env var optional, default 3002)
 * Behind a reverse proxy set TRUST_PROXY=1 so rate limiting sees real client IPs.
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = process.env.PORT || 3002;
// localhost-only by default so in production only the TLS proxy can reach us;
// set HOST=0.0.0.0 for LAN testing (e.g. opening the app from your phone)
const HOST = process.env.HOST || '127.0.0.1';
// overridable so the test suite can run against a throwaway directory
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
// kept 10 days after the last dose - covers a typical 7-day antibiotic course
// with a follow-up visit, then erased (privacy over long-term archive)
const TTL_MS = 10 * 24 * 60 * 60 * 1000; // 10 days
const MAX_LIFE_MS = 60 * 24 * 60 * 60 * 1000; // hard cap: no tracker outlives 60 days
const MAX_ENTRIES = 500;
const MAX_BODY = 8 * 1024; // 8 KB request body cap

fs.mkdirSync(DATA_DIR, { recursive: true });

/* ---------------------------------------------------------------- tokens */

const TOKEN_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // no O/0
const TOKEN_RE = /^[a-zA-Z1-9]{14}$/;

function newToken() {
  // rejection sampling: 256 % 60 !== 0, so a plain modulo would bias the
  // first 16 alphabet characters - only accept bytes below the largest
  // multiple of the alphabet length
  const limit = 256 - (256 % TOKEN_ALPHABET.length);
  let t = '';
  while (t.length < 14) {
    for (const b of crypto.randomBytes(28)) {
      if (b < limit && t.length < 14) t += TOKEN_ALPHABET[b % TOKEN_ALPHABET.length];
    }
  }
  return t;
}

/* ---------------------------------------------------------------- storage */

function trackerPath(id) {
  return path.join(DATA_DIR, id + '.json');
}

function loadTracker(id) {
  if (!TOKEN_RE.test(id)) return null;
  let raw;
  try {
    raw = fs.readFileSync(trackerPath(id), 'utf8');
  } catch {
    return null;
  }
  let t;
  try {
    t = JSON.parse(raw);
  } catch {
    return null;
  }
  if (Date.now() > t.expiresAt) {
    try { fs.unlinkSync(trackerPath(id)); } catch {}
    return null;
  }
  return t;
}

function saveTracker(t) {
  // write-then-rename so a crash mid-write can never truncate a tracker
  const dest = trackerPath(t.id);
  const tmp = dest + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(t));
  fs.renameSync(tmp, dest);
}

function purgeExpired() {
  let files;
  try { files = fs.readdirSync(DATA_DIR); } catch { return; }
  const now = Date.now();
  for (const f of files) {
    const fp = path.join(DATA_DIR, f);
    if (f.endsWith('.tmp')) {
      // orphaned temp file from a crash mid-save
      try {
        if (now - fs.statSync(fp).mtimeMs > 3600_000) fs.unlinkSync(fp);
      } catch {}
      continue;
    }
    if (!f.endsWith('.json')) continue;
    try {
      const t = JSON.parse(fs.readFileSync(fp, 'utf8'));
      if (now > t.expiresAt) fs.unlinkSync(fp);
    } catch {
      // unreadable file older than TTL - remove it too
      try {
        if (now - fs.statSync(fp).mtimeMs > TTL_MS) fs.unlinkSync(fp);
      } catch {}
    }
  }
}
purgeExpired();
setInterval(purgeExpired, 60 * 60 * 1000).unref();

/* ---------------------------------------------------------------- rate limiting */

// Sliding-window counters per IP. Two buckets: tracker creation (expensive,
// abusable) and everything else. Memory is bounded by periodic sweep.
const rlCreate = new Map(); // ip -> {count, windowStart}
const rlApi = new Map();

// returns 0 when allowed, otherwise seconds until the window resets
function limited(map, ip, maxPerWindow, windowMs) {
  const now = Date.now();
  let e = map.get(ip);
  if (!e || now - e.windowStart >= windowMs) {
    e = { count: 0, windowStart: now };
    map.set(ip, e);
  }
  e.count++;
  if (e.count <= maxPerWindow) return 0;
  return Math.max(1, Math.ceil((e.windowStart + windowMs - now) / 1000));
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of rlCreate) if (now - e.windowStart > 3600_000) rlCreate.delete(ip);
  for (const [ip, e] of rlApi) if (now - e.windowStart > 900_000) rlApi.delete(ip);
}, 10 * 60 * 1000).unref();

function clientIp(req) {
  if (process.env.TRUST_PROXY === '1') {
    // Behind Caddy in production: take the LAST X-Forwarded-For address
    // - the one our own proxy appended. Earlier entries are client-supplied
    // and trivially spoofable, which would let an attacker mint a fresh
    // rate-limit bucket per request.
    const xf = req.headers['x-forwarded-for'];
    if (xf) {
      const parts = xf.split(',');
      return parts[parts.length - 1].trim();
    }
  }
  return req.socket.remoteAddress || 'unknown';
}

/* ---------------------------------------------------------------- helpers */

// An fs error embeds the tracker file's path, and that path is the secret
// token (files are named <token>.json). For such errors log only the
// token-free code + syscall, so a disk-full or permission failure can't write
// a bearer link into the service log (journald). Errors without a code carry
// no token, so keep their full detail for debugging.
function logErr(label, err) {
  if (err && err.code) console.error(label, err.code, err.syscall || '');
  else console.error(label, err);
}

function sendJson(res, status, obj, extraHeaders) {
  if (res.headersSent) return res.end();
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

function readBody(req, res, cb) {
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json')) {
    return sendJson(res, 415, { error: 'Content-Type must be application/json' });
  }
  let size = 0;
  const chunks = [];
  let aborted = false;
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BODY) {
      aborted = true;
      sendJson(res, 413, { error: 'Request too large' });
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('end', () => {
    if (aborted) return;
    let obj;
    try {
      obj = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON' });
    }
    // the callback runs on a later tick, outside the top-level try/catch -
    // guard it separately so a failed disk write can't crash the process
    try {
      cb(obj);
    } catch (err) {
      logErr('Handler error:', err);
      sendJson(res, 500, { error: 'Internal server error' });
    }
  });
  req.on('error', () => {});
}

function cleanStr(v, maxLen) {
  if (typeof v !== 'string') return '';
  return v
    // control chars and Unicode bidi overrides (e.g. U+202E could visually
    // reverse text in the doctor summary)
    .replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

// integer in [min, max], or null when absent (allowed = optional field)
function intIn(v, min, max) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return undefined; // invalid
  return n;
}

function validEntry(body) {
  const med = cleanStr(body.med, 60);
  if (!med) return null; // the medicine name is the one required field

  const dose = cleanStr(body.dose, 40);
  const note = cleanStr(body.note, 200);

  // the user's OWN "repeats every N hours" plan - optional, pure arithmetic
  // on their entered schedule; Doza has no drug database and no dose logic
  const intervalH = intIn(body.intervalH, 1, 72);
  if (intervalH === undefined) return null; // present but not a whole number of hours 1-72

  let ts = Number(body.ts);
  const now = Date.now();
  // allow backdating up to 10 days, future up to 5 minutes
  if (!Number.isFinite(ts) || ts > now + 5 * 60_000 || ts < now - TTL_MS) ts = now;

  return {
    id: crypto.randomBytes(6).toString('hex'),
    ts,
    med,
    dose,
    intervalH,
    note,
  };
}

/* ---------------------------------------------------------------- static files */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveFile(req, res, file, status = 200) {
  const fp = path.join(PUBLIC_DIR, file);
  fs.stat(fp, (err, st) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const lastMod = st.mtime.toUTCString();
    // no-cache + Last-Modified: browsers revalidate every load and get a
    // cheap 304 when nothing changed, while updates still ship immediately
    if (status === 200 && req.headers['if-modified-since'] === lastMod) {
      res.writeHead(304, { 'Last-Modified': lastMod, 'Cache-Control': 'no-cache' });
      return res.end();
    }
    const headers = {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Last-Modified': lastMod,
      'Content-Length': st.size,
    };
    if (req.method === 'HEAD') {
      res.writeHead(status, headers);
      return res.end();
    }
    fs.readFile(fp, (err2, buf) => {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not found');
      }
      res.writeHead(status, headers);
      res.end(buf);
    });
  });
}

/* ---------------------------------------------------------------- server */

function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const ip = clientIp(req);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer'); // keep tracker URLs out of referrers
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // TRUST_PROXY=1 means we're behind a TLS proxy in production - pin HTTPS
  // for 180 days (browsers ignore this header on plain-HTTP local runs)
  if (process.env.TRUST_PROXY === '1') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  }

  /* ----- API ----- */
  if (p.startsWith('/api/')) {
    const apiWait = limited(rlApi, ip, 120, 15 * 60_000);
    if (apiWait) {
      return sendJson(res, 429,
        { error: 'Too many requests. Please slow down and try again in a few minutes.' },
        { 'Retry-After': String(apiWait) });
    }

    // POST /api/new - create tracker
    if (p === '/api/new' && req.method === 'POST') {
      const createWait = limited(rlCreate, ip, 3, 3600_000);
      if (createWait) {
        return sendJson(res, 429,
          { error: 'Too many new trackers created from your network. Try again later.' },
          { 'Retry-After': String(createWait) });
      }
      const now = Date.now();
      const t = {
        id: newToken(),
        createdAt: now,
        expiresAt: now + TTL_MS,
        name: '',
        entries: [],
      };
      saveTracker(t);
      return sendJson(res, 201, { id: t.id, expiresAt: t.expiresAt });
    }

    // PUT /api/t/:id/name - set tracker name/description
    const nm = p.match(/^\/api\/t\/([^/]+)\/name$/);
    if (nm && req.method === 'PUT') {
      if (!loadTracker(nm[1])) return sendJson(res, 404, { error: 'This tracker does not exist or has expired.' });
      return readBody(req, res, (body) => {
        // re-load after the async body read: another request may have saved
        // in the meantime, and mutating the earlier snapshot would erase it
        const t = loadTracker(nm[1]);
        if (!t) return sendJson(res, 404, { error: 'This tracker does not exist or has expired.' });
        t.name = cleanStr(body.name, 60);
        saveTracker(t);
        return sendJson(res, 200, t);
      });
    }

    // /api/t/:id[/entries[/:entryId]]
    const m = p.match(/^\/api\/t\/([^/]+)(?:\/entries(?:\/([a-f0-9]{12}))?)?$/);
    if (m) {
      const t = loadTracker(m[1]);
      if (!t) return sendJson(res, 404, { error: 'This tracker does not exist or has expired.' });

      // GET /api/t/:id - full tracker
      if (!m[2] && req.method === 'GET' && !p.includes('/entries')) {
        return sendJson(res, 200, t);
      }

      // POST /api/t/:id/entries - add entry
      if (req.method === 'POST' && p.endsWith('/entries')) {
        return readBody(req, res, (body) => {
          const entry = validEntry(body);
          if (!entry) return sendJson(res, 400, { error: 'Invalid entry. A medicine name is required, and "repeats every" must be a whole number of hours (1–72).' });
          // re-load after the async body read: both caregivers saving at the
          // same moment must not overwrite each other's entry
          const fresh = loadTracker(m[1]);
          if (!fresh) return sendJson(res, 404, { error: 'This tracker does not exist or has expired.' });
          if (fresh.entries.length >= MAX_ENTRIES) return sendJson(res, 400, { error: 'Entry limit reached for this tracker.' });
          fresh.entries.push(entry);
          fresh.entries.sort((a, b) => a.ts - b.ts);
          // activity extends life, but never past the 60-day hard cap
          fresh.expiresAt = Math.min(Date.now() + TTL_MS, fresh.createdAt + MAX_LIFE_MS);
          saveTracker(fresh);
          return sendJson(res, 201, fresh);
        });
      }

      // DELETE /api/t/:id/entries/:entryId - remove a mistaken entry
      if (req.method === 'DELETE' && m[2]) {
        const before = t.entries.length;
        t.entries = t.entries.filter((e) => e.id !== m[2]);
        if (t.entries.length === before) return sendJson(res, 404, { error: 'Entry not found.' });
        t.expiresAt = Math.min(Date.now() + TTL_MS, t.createdAt + MAX_LIFE_MS);
        saveTracker(t);
        return sendJson(res, 200, t);
      }
    }

    return sendJson(res, 404, { error: 'Not found' });
  }

  /* ----- pages / static ----- */
  // tracker pages must never be indexed (the URL is the credential); the
  // landing page is intentionally indexable, so the noindex is a header on
  // /t/* only rather than a blanket meta tag in the shared index.html
  if (p.startsWith('/t/')) res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method not allowed');
  }

  if (p === '/' || /^\/t\/[a-zA-Z1-9]{14}$/.test(p)) return serveFile(req, res, 'index.html');
  if (p === '/style.css') return serveFile(req, res, 'style.css');
  if (p === '/app.js') return serveFile(req, res, 'app.js');
  if (p === '/favicon.svg' || p === '/favicon.ico') return serveFile(req, res, 'favicon.svg');

  return serveFile(req, res, 'index.html', 404);
}

const server = http.createServer((req, res) => {
  try {
    handle(req, res);
  } catch (err) {
    // a thrown handler (e.g. disk full in saveTracker) must never take the
    // process - and everyone else's tracker - down with it
    logErr('Handler error:', err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

process.on('uncaughtException', (err) => logErr('Uncaught exception:', err));
process.on('unhandledRejection', (err) => logErr('Unhandled rejection:', err));

server.listen(PORT, HOST, () => {
  console.log(`Doza running on http://${HOST}:${PORT}`);
});
