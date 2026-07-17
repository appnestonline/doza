# Doza

A tiny, anonymous medication-course tracker. During a bounded course - a
child's 7-day antibiotic, post-op painkillers, eye drops - log every dose
given and see at a glance, per medicine, how long ago the last dose was and
when the next one is planned. Share one link between two caregivers so nobody
double-doses; hand the doctor a plain-text summary at the follow-up.

Part of the **appnest** family of small tools (siblings: **Febra**, a child
fever & medication tracker, and **Tensio**, a blood pressure diary). All run
on the same small VPS behind one Caddy instance.

## Run

```
node server.js
```

Requires Node.js 18+. No npm dependencies. Open http://localhost:3002

Run the regression tests (spawns a throwaway server on port 3999 with an
isolated temp data dir - never touches `./data`):

```
node test.js
```

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3002` | Listen port |
| `HOST` | `127.0.0.1` | Bind address - localhost-only by default; set `0.0.0.0` for LAN testing (e.g. from your phone) |
| `TRUST_PROXY` | off | Set `1` behind the reverse proxy so rate limiting reads the last `X-Forwarded-For` entry (the real client IP) instead of the proxy's own address |

## How it works

- **Random links, no accounts.** "Create a tracker" mints a 14-character
  random code (`/t/kR3xP9…`). The link is the only key to the data - bookmark
  it or send it to the other caregiver (security by obscurity).
- **Temporary by design.** A tracker lives for **10 days after its last
  entry**, then it is permanently deleted. A banner on the page shows the
  exact deletion date; every new entry extends it by 10 days, up to a hard
  cap of **60 days** total so a tracker can't be kept alive forever.
- **Entries** hold the medicine (required), dose text, an optional "repeats
  every N hours" plan (1–72, the *user's own* schedule), time (editable, so
  doses can be added later) and a note. Each entry shows the time since the
  last dose of *any* medicine and since the last dose of the *same* medicine.
- **Per-medicine status.** A card above the form lists every medicine with
  its last dose ("3 h 20 min ago, at 14:02"), a plain count of doses in the
  rolling last 24 h, and - when a plan was entered - the projected next dose
  ("next ≈ 22:02"; a past projection is shown as a neutral fact, not an
  alert). It refreshes every 30 seconds.
- **No retyping.** Medicine + dose combinations already used appear as
  one-tap "Quick entry" chips (which also restore that combo's plan), and as
  dropdown suggestions in the fields themselves.
- **Dose timeline.** With two or more entries, a chart draws one lane per
  medicine with a dot per dose and day separators - who got what, when, at a
  glance. Doses only; no values, no thresholds.
- **Doctor summary.** One click builds a plain-text summary (per-medicine
  dose counts, first/last dose, average and longest gap, the entered plan,
  full timeline) that can be copied or printed.
- **Dark mode** follows the device's colour-scheme preference - kinder for
  night-time doses - with a manual toggle in the header.
- **Finding it again.** The landing page lists up to 5 recent trackers from
  this device, and the expiry notice turns into a red warning during the
  final 24 hours.
- **Rate limiting.** Per-IP in-memory limits: 3 new trackers/hour,
  120 API requests/15 min (429 responses carry a `Retry-After` header).
  Request bodies capped at 8 KB, 500 entries per tracker, "repeats every"
  validated to whole hours 1–72.
- **Hardening.** Strict Content-Security-Policy, no framing, atomic file
  writes (a crash can't corrupt a tracker), a crashed request can't take the
  process down, and control/bidi characters are stripped from all text input.

## Deploying on a VPS

Doza is a real Node.js process (in-memory rate-limit counters, files on disk
between requests), so static hosts like Netlify can't run it - it needs a
persistent process and disk, which the VPS provides.

The box: a small Ubuntu VPS with Caddy in front for
automatic HTTPS. Febra listens on `127.0.0.1:3000`, Tensio on `:3001`, Doza
on `:3002`. Only Caddy is public.

> **Paths below assume the appnest layout** (`/home/deploy/apps/<app>`, run as
> user `deploy`), matching `APPNEST_TOOLKIT.md` and `deploy/doza.service`. If
> your box uses a different path or service user, adjust the unit file and the
> commands to match.

### 1. DNS (one-time, at your registrar)

Add an **A record** (or a wildcard) pointing `doza` at your server's IP. Once it resolves, Caddy
issues the Let's Encrypt certificate automatically on first hit.

### 2. Get the code on the box

Node, Caddy, the `deploy` user and the firewall are already set up from
Febra's deployment - a new tool does not redo any of that.

```bash
git clone <your-private-repo-url> /home/deploy/apps/doza
mkdir -p /home/deploy/apps/doza/data
```

(The private repo doubles as the off-box backup. The VPS's own snapshot
covers the `data/` folder.)

### 3. Install the systemd service

The unit is in this repo at `deploy/doza.service` (`User=deploy`,
`PORT=3002`, `TRUST_PROXY=1`, and `ReadWritePaths=/home/deploy/apps/doza/data`,
which is required - `ProtectSystem=strict` blocks the first disk write without
it).

```bash
sudo cp /home/deploy/apps/doza/deploy/doza.service /etc/systemd/system/doza.service
sudo systemctl daemon-reload
sudo systemctl enable --now doza
sudo systemctl status doza   # should show "active (running)"
```

### 4. Add the Caddy block

Append the block from `deploy/Caddyfile` to `/etc/caddy/Caddyfile` (Febra's
and Tensio's blocks live in the same file), then reload:

```bash
sudo systemctl reload caddy
```

Open `https://doza.appnest.online` from any device - Doza is live. Remember
to add Doza to Febra's and Tensio's `.more-tools` cross-links so the family
stays discoverable.

### 5. Updating later

```bash
cd /home/deploy/apps/doza && git pull
sudo systemctl restart doza   # only needed if server.js changed
```

Pure `public/` changes (HTML/CSS/JS) are served fresh on the next load thanks
to the `no-cache` + `Last-Modified` revalidation - no restart required. The
`data/` folder is never touched, so trackers survive updates.

## Deploying elsewhere

The tracker link is the password, so the deployment must not leak URLs. The
app never logs them; make sure the proxy in front doesn't either. Any host
that runs a long-lived Node process with a writable disk works. The rules:

1. **HTTPS on** - without it the secret link crosses the network in plain text.
2. **`TRUST_PROXY=1`** on the Node process - rate limiting then uses the last
   `X-Forwarded-For` address, the one appended by your own proxy. Without it,
   every request looks like `127.0.0.1` and the whole server shares one
   rate-limit bucket.
3. **Bind stays on 127.0.0.1** (the default) so only the proxy can reach Node.
4. **No or short-lived access logs** at the proxy - every stored `/t/<token>`
   line is a credential to someone's health data.
5. Run under a supervisor (systemd) so the process restarts on reboot. The app
   is single-instance by design: in-memory rate limits and file storage assume
   exactly one Node process.

## Files

| File | Purpose |
|---|---|
| `server.js` | Zero-dependency HTTP server: API, static files, rate limiting, hourly purge of expired trackers |
| `public/index.html` | Single page - landing, tracker and expired views |
| `public/app.js` | Client logic: rendering, per-medicine status, deltas, timeline, summary, clipboard |
| `public/style.css` | Styling |
| `data/` | One JSON file per tracker (created at runtime, auto-purged) |
| `deploy/doza.service` | systemd unit for running Doza on the VPS |
| `deploy/Caddyfile` | Caddy reverse-proxy + automatic HTTPS block for `doza.appnest.online` |
| `APPNEST_TOOLKIT.md` | House style & build recipe shared across the appnest family |

Doza is a note-taking aid, not medical advice. It has no drug database, no
dose calculators and no warnings - the only schedule logic is arithmetic on
the plan you enter yourself. Always follow the dose and schedule from your
doctor and the medicine leaflet.

## License

MIT - see `LICENSE`.
