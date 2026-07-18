# Doza

Anonymous, shareable **medication-course tracker** - part of the **appnest**
family of small, private health tools (siblings:
[Febra](https://febra.appnest.online) child fever & medication,
[Tensio](https://tensio.appnest.online) blood pressure,
[Mena](https://mena.appnest.online) period & cycle). Same zero-dependency
Node.js stack across the family, same visual skeleton, own accent hue (forest
green) and domain logic.

Live at **https://doza.appnest.online**.

## What it does

- Log every dose during a bounded course - a 7-day antibiotic, post-op
  painkillers, eye drops: **medicine** (required), **dose** text, an optional
  **"repeats every N hours"** plan (1-72, the *user's own* schedule), an
  editable time and a note.
- A **per-medicine status card** lists each medicine's last dose, a plain
  count of doses in the rolling last 24 h, and - when a plan was entered -
  the projected next dose. Refreshes every 30 seconds.
- **No retyping**: medicine + dose combinations already used come back as
  one-tap "Quick entry" chips (which restore that combo's plan too) and as
  dropdown suggestions.
- A **dose timeline** (two or more entries) draws one lane per medicine with a
  dot per dose - who got what, when, at a glance.
- A one-click **plain-text summary** for the doctor - per-medicine dose
  counts, first/last dose, average and longest gap, the entered plan, full
  timeline - can be copied or printed.
- Share the private link between caregivers so nobody double-doses.
- **EN + HR**, light/dark themes, no account, no cookies, no third parties.

Doza is a note-taking aid, not medical advice. It has no drug database, no
dose calculators and no warnings - the only schedule logic is arithmetic on
the plan you enter yourself. Always follow the dose and schedule from your
doctor and the medicine leaflet.

## Privacy & lifetime

No accounts. A tracker lives at an unguessable random link (`/t/<14-char
token>`) - that link is the only key, so share it only with people you trust.
Data is kept **10 days after the last entry** (60 days at most), then
permanently erased; a banner shows the exact deletion date and turns into a
warning during the final 24 hours.

Per-IP rate limits: 3 new trackers/hour, 120 API requests/15 min (`429`
responses carry `Retry-After`). Request bodies are capped at 8 KB, entries at
500 per tracker. See `RESEARCH.md` for the reasoning behind the product
decisions.

## Run locally

```sh
node server.js            # http://127.0.0.1:3002
node test.js              # zero-dependency regression suite (static + e2e)
```

`PORT`, `HOST`, `DATA_DIR`, `TRUST_PROXY` are read from the environment.

## Deploy

One Node process behind Caddy on a small VPS; port **3002**, binds
`127.0.0.1`. See `deploy/doza.service` and `deploy/Caddyfile`, and
[`APPNEST_TOOLKIT.md`](APPNEST_TOOLKIT.md) for the family-wide build & deploy
recipe (visual identity, server/client spine, per-app deploy steps).

```sh
git pull && sudo systemctl restart doza   # only needed if server.js changed
```

Pure `public/` changes (HTML/CSS/JS) are served fresh on the next load
(`no-cache` + `Last-Modified` revalidation) - no restart required.

### Deploying elsewhere

The tracker link is the password, so the deployment must not leak URLs. Any
host that runs a long-lived Node process with a writable disk works. The
rules:

1. **HTTPS on** - without it the secret link crosses the network in plain text.
2. **`TRUST_PROXY=1`** on the Node process - rate limiting then uses the last
   `X-Forwarded-For` address (the one appended by your own proxy). Without it,
   every request looks like it comes from the proxy, and the whole server
   shares one rate-limit bucket.
3. **Bind stays on `127.0.0.1`** (the default) so only the proxy can reach Node.
4. **No or short-lived access logs** at the proxy - every stored `/t/<token>`
   line is a credential to someone's health data. Doza itself never logs
   tracker URLs.
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
| `data/` | One JSON file per tracker (created at runtime, gitignored, auto-purged) |
| `deploy/doza.service` | systemd unit for running Doza on a VPS |
| `deploy/Caddyfile` | Caddy reverse-proxy + automatic HTTPS block for `doza.appnest.online` |
| `APPNEST_TOOLKIT.md` | House style & build recipe shared across the appnest family |
| `RESEARCH.md` | Product research & decisions behind this tool |
| `test.js` | Static + end-to-end regression suite |

## License

MIT - see `LICENSE`.
