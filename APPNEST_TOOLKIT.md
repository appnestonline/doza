# Appnest Toolkit - house style & build recipe for new tools

> **Who this is for:** a Claude Code session building a *new* small web tool that will
> live on the `appnest.online` server alongside Febra and Tensio and should **look, feel,
> and behave like part of the same family**. Febra (`/home/deploy/apps/febra`) is the
> reference implementation - when in doubt, open its `server.js`, `public/`, and `test.js`
> and copy the pattern. Tensio (blood-pressure diary) is the worked example of a *second*
> tool built from that pattern - a good diff to study for "what actually changes per tool";
> Doza (medication-course tracker) is a *third*.
>
> **Scope note:** this public copy covers *how to build a tool that fits the family* and
> the generic per-app deploy steps. Server specifics (access, credentials, backups,
> monitoring) live in a private infra doc and are deliberately not repeated here.
>
> **Owner profile:** a developer who is also the DBA and sysadmin. Comfortable on
> Linux/CLI. Prefers lean, transparent, reproducible setups over managed
> abstractions and heavy frameworks. Keep explanations technical and concise; keep code
> dependency-free.

---

## What fits this model (read before proposing a new tool)

The architecture is purpose-built for **episodic, short-term tracking** - a person records
one simple thing for a bounded stretch, shares it by link, hands a summary to a professional,
and then the data expires. That episodic shape is *why* the privacy posture works (no
accounts, auto-expiry) and *why* the tool can stay tiny (one process, files, no sync).

- **Good fit:** a defined measuring episode with a clear end. Febra = a fever (days).
  Tensio = a pre-visit BP protocol (a week or two). Doza = a course of medication (days to a
  few weeks). Others in the same shape: a symptom/pain diary before a specialist visit, a
  peak-flow log during an asthma flare, a migraine diary for a neurology appointment.
- **TTL is sized to the episode, not fixed.** Febra keeps data 5 days after the last entry
  (cap 30); Tensio 15 days (cap 1 year); Doza 10 days (cap 60). Pick the shortest window that outlives the real
  use, then let it erase. Longer TTLs quietly erode the "temporary by design" identity - if
  a tool seems to need *months*, question whether it fits at all.
- **Poor fit:** chronic, lifelong conditions (e.g. diabetes day-to-day management). They
  want years of history, accounts, and usually device/sensor sync - all of which break the
  privacy model, the zero-dependency rule, and the single-file storage. They also tend to
  sit in saturated, device-locked markets. Don't stretch this model to cover them.

---

## 0. The five non-negotiables

Every appnest tool follows these. They are what make the family coherent and the server safe:

1. **Zero runtime dependencies.** Plain Node.js core (`node:http`, `node:fs`, `node:crypto`).
   No Express, no npm install to run. (A `package-lock.json` may exist but there is no
   build step and no `node_modules` in production.)
2. **One process, localhost-only, unique port.** Binds `127.0.0.1` on its own port; only
   Caddy is public. Reads `PORT`/`HOST` from env.
3. **Strict security headers on every response** (CSP `default-src 'self'`, no framing,
   nosniff, no-referrer, HSTS behind proxy). No third-party scripts, fonts, frames, or
   trackers - ever. This keeps the CSP tight and the privacy promise true.
4. **Privacy-respecting & minimal.** Collect the least possible; if there's server-side
   state, make it expire; no accounts unless truly required; a plain-language privacy note
   in the footer.
5. **Ships with `test.js`** - a zero-dependency regression suite (static checks + a real
   spawned-server run against a throwaway data dir). Green before every deploy.

If a requirement seems to need breaking one of these (e.g. an embedded third-party widget),
**stop and ask the owner** - that's a deliberate posture change, not a default.

---

## 1. Visual identity - the house style

The look is **calm, adult, clinical-but-warm. Not childish, not flashy.** Generous
whitespace, one accent colour, soft cards on a near-white (or near-black) background,
system fonts, rounded-12px corners, barely-there shadows.

### 1.1 The palette (copy this verbatim; change only `--accent*`)

The fastest correct start is: **copy Febra's `public/style.css` and change the accent hue.**
The neutral tokens and the whole dark-mode machinery stay identical across tools - that
shared skeleton *is* the family resemblance. Only the three `--accent*` values (and their
dark-mode counterparts) express the individual tool's identity.

Light `:root`:
```css
:root {
  --bg: #f6f7f9; --surface: #ffffff;
  --ink: #1c2430; --ink-soft: #5b6674; --ink-faint: #8d97a5;
  --accent: #0f766e; --accent-ink: #ffffff; --accent-soft: #e6f2f1;   /* ← per-tool identity */
  --warn-bg: #fff7e6; --warn-border: #f0d9a8; --warn-ink: #7a5b16;
  --danger: #b3423a; --warm: #b06a12; --line: #e3e7ec;
  --input-bg: #fbfcfd; --input-focus-bg: #ffffff; --btn-primary-hover: #0b5f58;  /* darker accent */
  --chip-hover: #d8ebe9; --del-hover-bg: #fdf1f0; --summary-bg: #f3f5f7;
  --urgent-bg: #fdecea; --urgent-border: #f2b8b1; --urgent-ink: #8f2f27;
  --radius: 12px;
  --shadow: 0 1px 2px rgba(16,24,40,.05), 0 4px 16px rgba(16,24,40,.06);
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

Dark (Febra's teal shown; swap the accent trio for your hue):
```css
--bg:#10151b; --surface:#1a222b; --ink:#e7ecf2; --ink-soft:#a6b1be; --ink-faint:#75808d;
--accent:#2fbcab; --accent-ink:#06211d; --accent-soft:#143430;   /* ← per-tool identity */
--warn-bg:#2b2410; --warn-border:#6a5620; --warn-ink:#eacc7b;
--danger:#f07b72; --warm:#e2a352; --line:#2b3542;
--input-bg:#141b22; --input-focus-bg:#10161c; --btn-primary-hover:#26a293;
--chip-hover:#1b453f; --del-hover-bg:#3a2320; --summary-bg:#141b22;
--urgent-bg:#3a1d19; --urgent-border:#7a3830; --urgent-ink:#f3a99f;
--shadow: 0 1px 2px rgba(0,0,0,.4), 0 4px 16px rgba(0,0,0,.35);
```

**Accent hues already taken:** Febra = teal `#0f766e` (dark `#2fbcab`); Tensio = slate-blue
`#3b5f8f` (dark `#6297d8`); Doza = forest green `#2f7d4f` (dark `#58b581`). Pick a *distinct
but equally calm, desaturated* hue for a new tool (e.g. muted plum, clay). Keep roughly the
same lightness/saturation so it reads as a sibling, not a different brand. `--accent-soft`
is a very light tint of the accent; `--btn-primary-hover` is the accent one step darker.

### 1.2 Dark mode (system + manual) - keep this architecture

Every visual difference is expressed as a **CSS variable override**, so the two triggers only
swap variables:

```css
@media (prefers-color-scheme: dark) { :root:not([data-theme]) { /* dark vars */ } }
:root[data-theme="dark"] { /* the same dark vars */ }
```

`[data-theme]` = the user's explicit choice (persisted); absent = follow the system. The
theme toggle in the header sets/removes `data-theme` on `<html>` and highlights the
*effective* theme. Never hard-code a dark colour in a component rule - add a variable.

Also set `color-scheme` so **native controls** (number-input spinners, scrollbars) follow
the toggle, not just the OS: `color-scheme: light dark` on `:root`, then
`:root[data-theme="light"]{color-scheme:light}` and `[data-theme="dark"]{color-scheme:dark}`.
Without this a light-themed page on a dark-mode OS renders a black spinner button (the number
inputs make this very visible).

### 1.3 Layout & core components (all in Febra's `style.css` - reuse)

- **Page:** `main { max-width: 860px; margin: 0 auto; padding: 0 20px 48px; }`. Everything
  is a single centred column.
- **Card:** `background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); padding: 22px;`
- **Buttons:** `.btn` + `.btn-primary` (accent fill) / `.btn-ghost` (surface + border) /
  `.btn-lg`. Radius 10px, weight 600.
- **Pill toggle** (`.unit-toggle`): the two-button segmented control used for °C/°F, 12h/24h,
  theme, language, L/R arm (Tensio). Reuse it for any binary/small-set switch - it's the
  signature control.
- **Toast** (`.toast`): fixed bottom-centre, dark pill, auto-hides ~2.6s. For transient
  confirmations.
- **Banner** (`.banner`, `.banner.urgent`): inline info strip; `urgent` variant for
  time-sensitive warnings.
- **Modal:** native `<dialog>` (used for the doctor summary and privacy note). Print styles
  target it.
- **`[hidden] { display: none !important; }`** is defined globally so the `hidden` attribute
  always wins over `display:flex` components. Keep it - it prevents a whole class of
  "empty box flashes on screen" bugs.

### 1.4 Header & footer conventions

- **Header** (`.topbar`): brand (small inline SVG mark in `--accent` + wordmark) · tagline
  · right-aligned controls (`.topbar-controls`): the **theme toggle** and, if the tool is
  translated, the **language toggle**, both as `.unit-toggle` pills with monochrome inline
  SVG / short text (no colour emoji - see Febra's sun/moon SVGs).
- **Footer** (`.footer`): one muted line naming the tool + its privacy stance, then a
  `.footer-links` row: **Support** (→ `https://ko-fi.com/appnest`, new tab,
  `rel="noopener noreferrer"`) · **Privacy** (opens the privacy `<dialog>`). Both use
  `.footer-link`.
- **Family cross-link** (`.more-tools`): a quiet pill at the bottom of the landing view -
  "More tools from the same family:" + a link to each sibling (its inline SVG mark drawn in
  *this* tool's accent + wordmark). Each app points at the others; add the new tool to the
  existing apps' cross-links when it ships, so the family is discoverable.

---

## 2. Technical recipe - reuse Febra's scaffolding

Start a new tool by copying Febra's `server.js` and `public/{index.html,app.js,style.css}`
and stripping the domain logic. The reusable spine:

### 2.1 Server (`server.js`)

- `http.createServer((req,res) => { try { handle(req,res) } catch { 500 } })` - a top-level
  try/catch so one thrown handler can never take the process down. Plus
  `process.on('uncaughtException'|'unhandledRejection', log)`.
- `DATA_DIR = process.env.DATA_DIR || path.join(__dirname,'data')` - overridable so tests
  use a throwaway dir.
- **Security headers** set on every response (copy exactly):
  ```
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=15552000      # only when TRUST_PROXY=1
  ```
- **Static serving:** `Cache-Control: no-cache` + `Last-Modified` + `If-Modified-Since` →
  304. Means edits ship on next load with no cache-busting, repeat loads stay cheap. Serve
  `HEAD` (headers only). Whitelist exact paths - never map a URL straight to the filesystem
  (no path traversal).
- **If the tool has an API/state**, copy these too: per-IP sliding-window rate limiting
  (`limited()` returning seconds-to-wait for `Retry-After`), `readBody()` (8 KB cap → 413,
  `application/json` required → 415), `cleanStr()` (strips C0 controls + Unicode bidi
  overrides), atomic writes (`writeFileSync` tmp → `renameSync`), and **re-load state inside
  the async body callback** before mutating (avoids the two-writers lost-update race). That
  re-load→mutate→save must stay **synchronous** - do not `await` anything between the reload
  and the save, or the lost-update race reopens (single-process safety depends on no yield
  point in that window).
- **Client IP behind proxy:** take the last `X-Forwarded-For` entry, only when
  `TRUST_PROXY=1`. Caddy sets `X-Forwarded-For`; the *last* hop is the trusted one - earlier
  entries are client-supplied and trivially spoofable.

### 2.2 Client (`public/app.js`)

- Wrap everything in an IIFE; `const $ = (id) => document.getElementById(id)`.
- **`store`** - a try/catch wrapper around `localStorage` (get/set/remove). localStorage
  throws in private mode / on quota; preferences must never break the app. Use it for *all*
  storage.
- **`show(name)`** view-switcher toggling `hidden` on top-level `<main>` sections.
- Render user data with `textContent`/`createElement` **only** - never `innerHTML` with
  user input. (Static i18n strings via `textContent` too.)
- Register event listeners, then call the big initial render **last**, so a render failure
  can't leave buttons unwired.

### 2.3 Internationalisation (if the tool is user-facing text-heavy)

Febra ships **EN + HR**. The owner is Croatian; default new tools to the same two languages
unless told otherwise. The pattern (copy it):

- `I18N = { en:{…}, hr:{…} }`. Plain strings for static text; **functions** for anything
  with interpolation or word-order differences (Croatian word order ≠ English).
- `t(key, ...args)` resolves current lang → falls back to `en` → falls back to the key.
- Static markup carries `data-i18n="key"`; `applyStaticI18n()` sets `textContent` +
  input placeholders + `document.title`.
- Language toggle persists to `store` and re-renders live (no reload).
- **Date/time format follows the language**: HR → 24h + `dd.mm.yyyy`, EN → 12h + `mm/dd/yyyy`,
  applied both at first load and on every language switch, so a Croatian user never sees
  American dates. The manual 12h/24h pill still overrides within a session.
- **Known limitation:** template i18n can't decline Croatian nouns (user-entered words stay
  nominative). Acceptable; don't try to fix with declension logic.
- `test.js` statically asserts every `data-i18n` key and every `t('key')` exists in **both**
  language tables - this catches the #1 i18n bug (a string translated on one side only).

### 2.4 GDPR / privacy note

If the tool stores anything server-side, add a footer **Privacy** link opening a `<dialog>`
with 3–4 plain sentences: *what* is stored, *where* (EU server) and *how long*, *technical
logs* (state honestly what the proxy keeps - see the logging decision in §3), and *user
control* (how data is deleted/expires). Health data is special-category under GDPR Art. 9
(children's, as in Febra, carries extra weight) - the honest posture (no accounts,
auto-expiry, minimal collection, no third parties) is the compliance story; the note just
makes it visible.

---

## 3. Deploying a new tool on the shared server

Full server context (access, firewall, backups, monitoring) lives in a private infra doc.

**Server-level setup is already done - a new tool does NOT redo it.** As of Febra's
deployment, the box (a small Ubuntu VPS) already has:
- Firewall open on 22 (SSH), 80/443 (HTTP/HTTPS).
- A system user `deploy` owning `/home/deploy/apps/`.
- Node.js (current LTS, via NodeSource - not the stale Ubuntu `apt` package) and Caddy
  installed.
- Git/SSH access from the `deploy` user to the `appnestonline` GitHub org already
  configured (reuse whatever method Febra used - e.g. an SSH deploy key - for new repos
  too; a repo per tool is the norm, doubling as off-box backup).

**DNS is a wildcard `*.appnest.online` → the server, already in place.** A new tool
needs **no new DNS record** - `<name>.appnest.online` resolves as soon
as you pick the name, and Caddy issues the certificate the moment its block is reloaded.
(The owner manages DNS manually, only for the `appnest.online` zone.)

Per-app steps, condensed:

1. **Pick the next free port.** Febra = 3000, Tensio = 3001. New tools: 3002, 3003, …
   Bind `127.0.0.1` only.
2. **No DNS step** - the wildcard above already resolves `<name>.appnest.online`, so go
   straight to the code/systemd/Caddy steps.
3. **Get code on the box:** `git clone` the tool's private repo into
   `/home/deploy/apps/<name>/`, as the `deploy` user. `mkdir -p
   /home/deploy/apps/<name>/data`.
4. **systemd unit** `/etc/systemd/system/<name>.service`, `User=deploy`, `Environment=PORT=<port>`,
   `HOST=127.0.0.1`, `TRUST_PROXY=1`, `Restart=on-failure`. If it writes to disk:
   `ProtectSystem=strict` **requires** `ReadWritePaths=/home/deploy/apps/<name>/data` - the
   #1 "won't start" gotcha. `enable --now`.
5. **Caddy block** appended to `/etc/caddy/Caddyfile`:
   ```
   <name>.appnest.online {
       reverse_proxy 127.0.0.1:<port>
       encode gzip
   }
   ```
   `sudo systemctl reload caddy`. Caddy auto-issues the Let's Encrypt cert on first hit
   (the wildcard DNS already resolves, so there's nothing to wait for).
6. **Logging decision:** the tracker `/t/<token>` URL *is* the credential (a bearer link),
   so how the proxy logs is a deliberate per-tool call. Current choice: **Febra, Tensio and Doza
   all log** to their own file (`log { output file /var/log/caddy/<name>.log }`, default
   Caddy JSON + auto-rotation) - the owner accepts that the token URLs sit in that file and
   treats it as sensitive; the per-app `*-stats.sh` scripts read it. The alternatives, if a
   future tool's data is more sensitive, are `output discard` or logging with the URI path
   stripped/redacted.
7. `node test.js` on the box after deploy (own port + temp dir → safe next to other live
   apps).

Updating later: `git pull && sudo systemctl restart <name>` (restart only needed if
`server.js` changed; pure `public/` changes are served fresh on next load).

---

## 4. New-tool checklist

- [ ] Copied Febra's `style.css`; changed only the `--accent*` trio (light + dark) to a new calm hue
- [ ] Copied the `server.js` spine: try/catch isolation, security headers, static serving, `DATA_DIR` override
- [ ] Copied the `app.js` spine: IIFE, `$`, `store` wrapper, `show()`, textContent-only rendering
- [ ] Header with theme toggle (+ language toggle if translated); footer with Support + Privacy links
- [ ] If stateful: rate limiting, `readBody` caps, `cleanStr`, atomic writes, re-load-before-mutate, expiry/TTL
- [ ] EN + HR via the `I18N`/`t()` pattern (if text-heavy)
- [ ] Privacy `<dialog>` if anything is stored server-side
- [ ] `test.js` passing (static + spawned-server e2e), green before every deploy
- [ ] Added to each sibling's `.more-tools` cross-link (and theirs added to this one)
- [ ] Zero runtime dependencies; no third-party scripts/fonts/frames
- [ ] Unique port, binds 127.0.0.1, reads `PORT`/`HOST`/`TRUST_PROXY` from env
- [ ] systemd unit + Caddy block; `ReadWritePaths` set if it writes to disk
- [ ] Private git repo (off-box backup + `git pull` deploy)

---

## 5. Deliberate non-goals (don't "improve" these without asking)

- **No frameworks / no build step / no npm runtime deps.** Vanilla is the point.
- **No third-party embeds, analytics, fonts, or CDNs.** Keeps CSP tight and privacy honest.
  (Ko-fi support is a plain *link*, not an embedded widget, for exactly this reason.)
- **No accounts / login** unless the tool genuinely can't work without it. "Security by
  obscurity" random-token URLs (Febra's model) are preferred for private-but-shareable data.
- **No medical/legal/financial advice or calculators.** Febra deliberately refused
  dose-by-weight calculators - note-taking aid, not advice. Keep tools in the aid lane.
- **Single instance.** In-memory state (rate limits) and file storage assume exactly one
  process. Don't add clustering without moving state to a store first.
- **No chronic/lifelong datasets.** These tools track an *episode* that ends, not a condition
  followed forever (see "What fits this model"). Anything needing years of history, accounts,
  or device/sensor sync is a different, heavier product - don't stretch this one to fit it.
```
