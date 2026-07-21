/**
 * Doza regression tests. Zero dependencies - plain Node.
 *
 * Run:  node test.js
 *
 * Part 1: static checks - both sources parse, every element id used by
 *         app.js exists in index.html, every i18n key exists in both languages.
 * Part 2: end-to-end API tests against a real server instance spawned on a
 *         throwaway port with a throwaway DATA_DIR (never touches ./data).
 */
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { spawn } = require('node:child_process');

const ROOT = __dirname;
const PORT = 3999;
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
}
async function checkAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
}

/* ================= Part 1: static checks ================= */

console.log('static checks');

const appJs = fs.readFileSync(path.join(ROOT, 'public', 'app.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');

check('app.js parses', () => new vm.Script(appJs));
check('server.js parses', () => new vm.Script(serverJs));

const headJs = fs.readFileSync(path.join(ROOT, 'public', 'head.js'), 'utf8');
check('head.js parses', () => new vm.Script(headJs));
check('head.js loads before the stylesheet (no flash)', () => {
  const iHead = indexHtml.indexOf('/head.js');
  const iCss = indexHtml.indexOf('/style.css');
  assert.ok(iHead !== -1, 'index.html does not load /head.js');
  assert.ok(iHead < iCss, '/head.js must come before /style.css in the head');
});

check("every $('id') used in app.js exists in index.html", () => {
  const ids = [...new Set([...appJs.matchAll(/\$\('([a-zA-Z0-9-]+)'\)/g)].map((m) => m[1]))];
  assert.ok(ids.length > 20, `suspiciously few ids found (${ids.length}) - extraction broken?`);
  const missing = ids.filter((id) => !indexHtml.includes(`id="${id}"`));
  assert.deepStrictEqual(missing, [], `ids missing from index.html: ${missing.join(', ')}`);
});

check('every data-i18n key in index.html exists in BOTH language tables', () => {
  const keys = [...new Set([...indexHtml.matchAll(/data-i18n="([a-zA-Z0-9]+)"/g)].map((m) => m[1]))];
  assert.ok(keys.length > 20, `suspiciously few i18n keys (${keys.length})`);
  // each key must appear at least twice as an object property (en + hr)
  const missing = keys.filter((k) => (appJs.match(new RegExp(`^\\s+${k}:`, 'gm')) || []).length < 2);
  assert.deepStrictEqual(missing, [], `keys not present in both tables: ${missing.join(', ')}`);
});

check("every t('key') call in app.js exists in BOTH language tables", () => {
  const keys = [...new Set([...appJs.matchAll(/\bt\('([a-zA-Z0-9]+)'/g)].map((m) => m[1]))];
  assert.ok(keys.length > 20, `suspiciously few t() keys (${keys.length})`);
  const missing = keys.filter((k) => (appJs.match(new RegExp(`^\\s+${k}:`, 'gm')) || []).length < 2);
  assert.deepStrictEqual(missing, [], `keys not present in both tables: ${missing.join(', ')}`);
});

/* ================= Part 2: API end-to-end ================= */

async function main() {
  console.log('api end-to-end');

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doza-test-'));
  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', DATA_DIR: dataDir, TRUST_PROXY: '1' },
    stdio: 'ignore',
  });

  // wait for the server to accept connections
  let up = false;
  for (let i = 0; i < 40 && !up; i++) {
    try {
      await fetch(BASE + '/');
      up = true;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  if (!up) {
    console.log('  FAIL  server did not start');
    child.kill();
    process.exit(1);
  }

  const post = (p, body, ct = 'application/json') =>
    fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': ct }, body: JSON.stringify(body) });

  try {
    /* --- static serving & headers --- */
    await checkAsync('GET / serves html with security headers', async () => {
      const r = await fetch(BASE + '/');
      assert.strictEqual(r.status, 200);
      assert.ok(r.headers.get('content-security-policy').includes("default-src 'self'"));
      assert.strictEqual(r.headers.get('x-frame-options'), 'DENY');
      assert.ok(r.headers.get('strict-transport-security'), 'HSTS missing under TRUST_PROXY=1');
      assert.ok(r.headers.get('last-modified'), 'Last-Modified missing');
    });

    await checkAsync('static 304 revalidation works', async () => {
      const r1 = await fetch(BASE + '/app.js');
      const r2 = await fetch(BASE + '/app.js', { headers: { 'If-Modified-Since': r1.headers.get('last-modified') } });
      assert.strictEqual(r2.status, 304);
    });

    await checkAsync('head.js serves as javascript', async () => {
      const r = await fetch(BASE + '/head.js');
      assert.strictEqual(r.status, 200);
      assert.ok(r.headers.get('content-type').includes('javascript'));
    });

    /* --- tracker lifecycle --- */
    let id;
    await checkAsync('create tracker returns valid token', async () => {
      const r = await post('/api/new');
      assert.strictEqual(r.status, 201);
      const b = await r.json();
      assert.match(b.id, /^[a-zA-Z1-9]{14}$/);
      id = b.id;
    });

    await checkAsync('GET tracker returns empty entries + name field', async () => {
      const r = await fetch(`${BASE}/api/t/${id}`);
      assert.strictEqual(r.status, 200);
      const b = await r.json();
      assert.deepStrictEqual(b.entries, []);
      assert.strictEqual(b.name, '');
    });

    await checkAsync('unknown token → 404', async () => {
      const r = await fetch(`${BASE}/api/t/aaaaaaaaaaaaaa`);
      assert.strictEqual(r.status, 404);
    });

    /* --- entries --- */
    let entryId;
    await checkAsync('POST valid entry (med+dose+intervalH)', async () => {
      const r = await post(`/api/t/${id}/entries`, { med: 'Amoxicillin', dose: '250 mg/5 ml', intervalH: 8, ts: Date.now() });
      assert.strictEqual(r.status, 201);
      const b = await r.json();
      assert.strictEqual(b.entries.length, 1);
      assert.strictEqual(b.entries[0].med, 'Amoxicillin');
      assert.strictEqual(b.entries[0].dose, '250 mg/5 ml');
      assert.strictEqual(b.entries[0].intervalH, 8);
      entryId = b.entries[0].id;
    });

    await checkAsync('POST med-only entry accepted (dose empty, intervalH null)', async () => {
      const r = await post(`/api/t/${id}/entries`, { med: 'Ibuprofen' });
      assert.strictEqual(r.status, 201);
      const b = await r.json();
      const e = b.entries[b.entries.length - 1];
      assert.strictEqual(e.med, 'Ibuprofen');
      assert.strictEqual(e.dose, '');
      assert.strictEqual(e.intervalH, null);
    });

    await checkAsync('entry with NO medicine rejected (400)', async () => {
      assert.strictEqual((await post(`/api/t/${id}/entries`, { dose: '5 ml', note: 'no med' })).status, 400);
      assert.strictEqual((await post(`/api/t/${id}/entries`, { med: '   ' })).status, 400);
    });

    await checkAsync('intervalH 0 / 73 / 2.5 / "abc" rejected (400)', async () => {
      assert.strictEqual((await post(`/api/t/${id}/entries`, { med: 'X', intervalH: 0 })).status, 400);
      assert.strictEqual((await post(`/api/t/${id}/entries`, { med: 'X', intervalH: 73 })).status, 400);
      assert.strictEqual((await post(`/api/t/${id}/entries`, { med: 'X', intervalH: 2.5 })).status, 400);
      assert.strictEqual((await post(`/api/t/${id}/entries`, { med: 'X', intervalH: 'abc' })).status, 400);
    });

    await checkAsync('intervalH boundaries 1 and 72 accepted', async () => {
      const r1 = await post(`/api/t/${id}/entries`, { med: 'Edge', intervalH: 1 });
      assert.strictEqual(r1.status, 201);
      const r72 = await post(`/api/t/${id}/entries`, { med: 'Edge', intervalH: 72 });
      assert.strictEqual(r72.status, 201);
      const b = await r72.json();
      assert.strictEqual(b.entries[b.entries.length - 1].intervalH, 72);
    });

    await checkAsync('intervalH empty string / null stored as null', async () => {
      const r1 = await post(`/api/t/${id}/entries`, { med: 'NullPlan', intervalH: '' });
      assert.strictEqual(r1.status, 201);
      let b = await r1.json();
      assert.strictEqual(b.entries[b.entries.length - 1].intervalH, null);
      const r2 = await post(`/api/t/${id}/entries`, { med: 'NullPlan', intervalH: null });
      assert.strictEqual(r2.status, 201);
      b = await r2.json();
      assert.strictEqual(b.entries[b.entries.length - 1].intervalH, null);
    });

    await checkAsync('control/bidi characters stripped from med', async () => {
      const med = String.fromCharCode(0x202e) + 'nili' + String.fromCharCode(7) + 'cixoma';
      const r = await post(`/api/t/${id}/entries`, { med });
      assert.strictEqual(r.status, 201);
      const b = await r.json();
      const stored = b.entries[b.entries.length - 1].med;
      assert.ok(![...stored].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 0x202e), `stored: ${JSON.stringify(stored)}`);
    });

    await checkAsync('timestamps outside window snap to now (server-side)', async () => {
      const past = Date.now() - 20 * 864e5; // beyond the 10-day backdate window
      const r = await post(`/api/t/${id}/entries`, { med: 'Old', ts: past });
      assert.strictEqual(r.status, 201);
      const b = await r.json();
      const stored = b.entries.find((e) => Math.abs(e.ts - past) < 1000);
      assert.strictEqual(stored, undefined, 'a 20-day-old timestamp was accepted verbatim');
    });

    await checkAsync('backdating within 10 days accepted verbatim', async () => {
      const past = Date.now() - 7 * 864e5;
      const r = await post(`/api/t/${id}/entries`, { med: 'Backdated', ts: past });
      assert.strictEqual(r.status, 201);
      const b = await r.json();
      assert.ok(b.entries.some((e) => Math.abs(e.ts - past) < 1000), 'a 7-day-old timestamp was not kept');
    });

    await checkAsync('6 concurrent POSTs all survive (no lost update)', async () => {
      const rs = await Promise.all(Array.from({ length: 6 }, (_, i) => post(`/api/t/${id}/entries`, { med: 'Race', dose: `${i} ml` })));
      assert.ok(rs.every((r) => r.status === 201));
      const b = await (await fetch(`${BASE}/api/t/${id}`)).json();
      assert.strictEqual(b.entries.filter((e) => e.med === 'Race').length, 6);
    });

    await checkAsync('DELETE entry works, unknown entry → 404', async () => {
      const r = await fetch(`${BASE}/api/t/${id}/entries/${entryId}`, { method: 'DELETE' });
      assert.strictEqual(r.status, 200);
      const r2 = await fetch(`${BASE}/api/t/${id}/entries/${entryId}`, { method: 'DELETE' });
      assert.strictEqual(r2.status, 404);
    });

    /* --- name --- */
    await checkAsync('PUT name stores trimmed, length-capped value', async () => {
      const r = await fetch(`${BASE}/api/t/${id}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '  Luka - amoxicillin  ' + 'x'.repeat(100) }),
      });
      assert.strictEqual(r.status, 200);
      const b = await r.json();
      assert.ok(b.name.startsWith('Luka - amoxicillin'));
      assert.ok(b.name.length <= 60);
    });

    /* --- protocol hardening --- */
    await checkAsync('non-JSON content type → 415', async () => {
      const r = await fetch(`${BASE}/api/t/${id}/entries`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{"med":"x"}' });
      assert.strictEqual(r.status, 415);
    });

    await checkAsync('oversized body → 413', async () => {
      const r = await post(`/api/t/${id}/entries`, { med: 'x', note: 'y'.repeat(9000) });
      assert.strictEqual(r.status, 413);
    });

    /* --- rate limiting (last: consumes the create window) --- */
    await checkAsync('4th tracker creation in an hour → 429 with Retry-After', async () => {
      await post('/api/new'); // #2 (first was created above)
      await post('/api/new'); // #3
      const r = await post('/api/new'); // #4
      assert.strictEqual(r.status, 429);
      assert.ok(Number(r.headers.get('retry-after')) > 0);
    });
  } finally {
    child.kill();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main();
