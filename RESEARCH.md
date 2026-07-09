# Doza - research & product decisions

> Medication-course tracker in the appnest family. Sibling of Febra (fever &
> medication) and Tensio (blood pressure): same stack (zero-dep Node, vanilla JS,
> EN+HR), same visual skeleton, own accent hue and domain logic. This document
> records the research and the decisions derived from it. Decisions marked ⚖ are
> recommendations awaiting the owner's confirmation.

---

## 1. Name & identity

- **Name: Doza** - Croatian *doza* is the everyday word for a dose of medicine
  (from Latin/medical *dosis*, Greek *δόσις*), and "dose" is transparent to any
  English reader. The name reads natively in both shipped languages, exactly like
  Febra (*febris* → *febra*) and Tensio (*tensio* → *tenzija*).
  - Runners-up considered: *Dosis* (stiffer, reads foreign in HR), *Kura*
    (HR colloquial for "a course of treatment" but opaque in EN), *Terapija*
    (too broad, and HR-only).
- **Accent hue: forest green** `#2f7d4f` (light) / `#58b581` (dark) - calm,
  desaturated, same perceived weight as Febra's teal `#0f766e` and Tensio's
  slate-blue `#3b5f8f`, clearly distinct from both; quietly echoes the pharmacy
  green cross. Full trio (light): `--accent:#2f7d4f; --accent-ink:#ffffff;
  --accent-soft:#e7f2ec`; hover `#26663f`. Dark: `--accent:#58b581;
  --accent-ink:#07271a; --accent-soft:#143323`; hover `#4aa572`. ⚖
- **Logo:** a capsule - white pill capsule rotated ~45° on a rounded
  forest-green square, centre split line in the accent colour. Same construction
  as the siblings' marks (rounded square + white symbol + accent detail). ⚖
- **Tagline:** "medication log you can share" (HR: "dnevnik lijekova koji
  možete podijeliti"). ⚖

---

## 2. Research findings (with sources)

### 2.1 The problem is duplication and timing, not just forgetting (drives the status card)

- **"Given twice" is the single most common home medication error in young
  children.** Of ~697,000 out-of-hospital medication errors in US children
  under 6 reported to poison control (2002–2012; one child every 8 minutes),
  **27.0%** were "inadvertently taking or being given medication twice".
  Analgesics were the most involved class. 25 children died over the period.
- For analgesics specifically, duplication (26.6%) plus doses-too-close-together
  (13.4%) account for **~40% of all errors**; paracetamol and ibuprofen dominate,
  and children ≤5 have >4× the error rate of older children.
- **Timing is the weakest link.** Electronically monitored 5–10-day pediatric
  antibiotic courses: doses given 62% of the time, but *on schedule* only
  **21%** of the time; just 11 of 100 children received every recommended dose -
  while prescribers guessed 78% of them were adherent. A timestamped log is
  ground truth that recall cannot provide.
- Only ~44% of adult patients report completing an antibiotic course; **63% of
  non-adherers stop once they feel better** - which is why the log shows the
  whole course, not just today.
- **Poison Control's own prevention advice for double dosing is literally this
  tool:** "keep a medication log" and "decide who will be giving each dose"
  when multiple caregivers are involved. The AAP likewise recommends written
  dose charts, and flags alternating paracetamol/ibuprofen regimens as
  error-prone "unless explicit instructions and charts are provided". A
  pictogram/plain-language dose sheet RCT cut dosing errors from ~48% to ~5%.
- **Caregiver visibility measurably improves adherence:** Medisafe's own data on
  1,617 non-adherent users showed 71% improved after adding a caregiver viewer;
  interactive two-way logging beats one-way reminders (23% vs ~4% improvement in
  a meta-analysis of 8 RCTs). Doza's tap-to-log + shared-view model is the
  pattern that works, without the notification machinery.

### 2.2 Dosing norms (drive validation ranges and the 24-hour count)

- Home analgesics cluster at **4–8 h intervals**, and NHS phrases safe use as a
  *minimum gap plus a rolling 24-hour count* ("wait at least 4 hours", "no more
  than 4 doses in 24 hours"). That framing is why the status card shows a
  neutral **"doses in the last 24 h"** count - the exact number caregivers are
  told to track - with no thresholds and no warnings.
- Outpatient **antibiotics run 1–4× daily for 1–14 days** (single-dose
  fosfomycin → 3-day TMP-SMX → 5–7-day pneumonia/sinusitis/cellulitis →
  10-day strep → 10–14-day pyelonephritis); NICE/NIHR evidence keeps shortening
  pediatric courses (3–5 days for CAP).
- **Post-op eye drops** are the longest common bounded course: a standard
  cataract regimen runs 3 concurrent medications at different frequencies for
  2–4 weeks including a mid-course taper, commonly extending to 4–6 weeks.
  Multi-medicine lanes and per-entry (editable) planned intervals cover this.
- **The planned-interval cap must be 72 h, not 48 h:** CDC's severe-candidiasis
  regimen places the second fluconazole dose 72 h after the first, and taper
  steps commonly go alternate-day.
- **How clinicians assess adherence (NICE CG76):** non-judgmentally, over a
  window of at least 7 days, looking for patterns, gaps and reasons - not a
  compliance percentage. The doctor summary therefore reports factual counts,
  average and longest gaps, and the user's notes, and deliberately computes no
  adherence score.

### 2.3 Retention (drives TTL)

- The sparsest real regimen found (72 h interval) still refreshes a 10-day
  window several times over, and a 60-day cap covers a 4–6-week drop taper.
  A months-long, surgeon-extended taper is chronic-shaped and out of scope
  (see the toolkit's "what fits this model").

### 2.4 Market & privacy (drive the posture)

- **The niche is genuinely open.** Medisafe's caregiver feature requires the
  second person to install the app and sync accounts; MyTherapy (the
  privacy-strongest mainstream option) still centres on a permanent in-app
  profile. No mainstream tool offers two caregivers sharing one temporary
  link with no accounts, no install, and data that self-destructs.
- **Privacy is a differentiator, not a nicety:** a BMJ study found 79% of
  sampled medicines apps share user data (55 entities, mostly analytics/ads);
  Medisafe collects name/birth date/address alongside full medication details
  and retains personal data up to 7 years.
- **GDPR:** a dose log is special-category health data (Art. 9, Recital 35)
  even without a name attached. No accounts, free-text labels, minimal fields,
  and hard server-side auto-expiry implement data minimisation (Art. 5(1)(c))
  and storage limitation (Art. 5(1)(e)) *by construction*; the visible
  "kept until" countdown makes the storage-limitation principle a feature.

Sources:

- [Out-of-hospital medication errors among young children in the United States, 2002–2012 (Pediatrics 2014)](https://pubmed.ncbi.nlm.nih.gov/25332497/)
- [Analgesic-related medication errors reported to US poison control centers](https://pmc.ncbi.nlm.nih.gov/articles/PMC6659012/)
- [Electronically monitored adherence to short-term antibiotic therapy in children (Pediatrics 2022)](https://pubmed.ncbi.nlm.nih.gov/36317476/)
- [Antibiotics for acute cough: international observational study of adherence (BJGP 2012)](https://bjgp.org/content/62/599/e429)
- [Prevalence and predictors of non-adherence to short-term antibiotics (PLOS ONE 2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9119442/)
- [Double dosing: what to do if you take too much - Poison Control](https://www.poison.org/articles/medication-errors-double-dosing)
- [Preventing home medication administration errors - AAP policy statement (2021)](https://publications.aap.org/pediatrics/article/148/6/e2021054666/183379/Preventing-Home-Medication-Administration-Errors)
- [Pictogram-based intervention to reduce liquid medication dosing errors (RCT, 2008)](https://pubmed.ncbi.nlm.nih.gov/18762597/)
- [One-way versus two-way text messaging on medication adherence (meta-analysis, 2015)](https://pubmed.ncbi.nlm.nih.gov/26087045/)
- [Paracetamol for children - NHS](https://www.nhs.uk/medicines/paracetamol-for-children/)
- [How and when to give ibuprofen for children - NHS](https://www.nhs.uk/medicines/ibuprofen-for-children/how-and-when-to-give-ibuprofen-for-children/)
- [Duration of antibiotic therapy for common infections](https://pmc.ncbi.nlm.nih.gov/articles/PMC9615468/)
- [3 days' antibiotic is effective in childhood pneumonia - NIHR](https://evidence.nihr.ac.uk/alert/short-course-antibiotics-effective-in-childhood-pneumonia/)
- [Standard drop regimen after routine cataract surgery](https://pmc.ncbi.nlm.nih.gov/articles/PMC7360419/)
- [Vulvovaginal candidiasis - CDC STI treatment guidelines](https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm)
- [Assessment of adherence - NICE CG76](https://www.ncbi.nlm.nih.gov/books/NBK55447/)
- [Data sharing practices of medicines-related apps (BMJ 2019)](https://pubmed.ncbi.nlm.nih.gov/30894349/)
- [Medisafe privacy policy](https://medisafe.com/privacy-policy) · [Medfriend caregiver-impact data](https://medisafe.com/education-resources/the-impact-of-medisafes-medfriend-caregiver-feature-on-adherence)
- [GDPR Art. 5](https://gdpr-info.eu/art-5-gdpr/) · [Recital 35](https://gdpr-info.eu/recitals/no-35/)

---

## 3. Product decisions

### 3.1 Retention / TTL ⚖

**10 days after last entry, hard cap 60 days** (vs Febra's 5/30 and Tensio's
15/365). Rationale: the sparsest regimen (72 h) refreshes the window many times
over; after the course ends, 10 days is enough to build/print the doctor summary
at the follow-up visit; 60 days covers a 4–6-week eye-drop taper. Accepted edge
case: months-long tapers don't fit and are out of scope. Entry cap: 500 per
tracker (a 6-week, 3-medicine, 4×-daily regimen ≈ 500; longer belongs to a
chronic tool).

### 3.2 Sharing - Febra's model exactly

Random unguessable 14-char link, no accounts, `noindex`, `no-referrer`. Killer
use cases: two parents dosing a child (never double-dose), an adult child
managing a parent's course remotely, and the printout at the follow-up
appointment. Poison Control's "keep a log + decide who gives each dose" advice
is the marketing story; the tool is the chart the AAP says to keep.

### 3.3 Entry model

| Field | Rules |
|---|---|
| Medicine | **required**, ≤60 chars, free text with suggestions from this tracker |
| Dose | optional, ≤40 chars, free text ("5 ml", "250 mg", "1 drop") - liquid doses drive >80% of pediatric errors, so no structured units and **no computation, ever** |
| Repeats every | optional, integer **1–72 h** - the user's *own* plan, drives the "next ≈" projection (72 h cap fits CDC's 72-h fluconazole regimen and alternate-day tapers) |
| Time | editable, defaults to now (Febra's masked input, 12h/24h toggle); backdate ≤10 days, future ≤5 min |
| Note | optional, ≤200 chars ("gave it - Ana", "with food", "half dose spat out") |

No °C/°F unit toggle (nothing to measure). "Who gave it" lives in the note
for v1. ⚖

### 3.4 Medicine status card (the headline feature)

One row per distinct medicine, most recently dosed first: **"last dose 3 h
20 min ago (at 14:02)"**, then **"next ≈ 22:02"** when a plan is set (last dose
+ planned interval; shown in the warm tone with "(time passed)" once overdue -
a fact, not an alarm), then a neutral **"3 doses in the last 24 h"** count
(the NHS-style rolling figure caregivers are told to track - no thresholds,
no colours). Refreshes every 30 s. Alternating paracetamol/ibuprofen naturally
becomes two rows.

### 3.5 Chart ⚖

A dose **timeline** (replaces Febra's fever curve): one horizontal lane per
medicine, a dot per dose, day separators at midnight, start/end time labels.
The vertical alignment of dots across lanes *is* the alternating-regimen chart
the AAP asks for. Pulse-style extras (expected-dose ghost marks from the plan)
deliberately left out of v1.

### 3.6 Doctor summary (modal + print, like Febra)

Header (name, generated, period, days covered), then **per medicine**: dose
count, dose text, first/last dose, average gap, **longest gap**, planned
interval if set. Then the full timeline with same-medicine deltas and notes.
**No adherence percentage** - NICE CG76 wants patterns and gaps presented
non-judgmentally; the percentages belong to the clinician. ⚖

### 3.7 Safety lane (Febra's precedent, strictly)

No drug database, no dose-by-weight, no maximum-dose warnings, no "too soon!"
alerts. The only schedule arithmetic allowed is on the user's own entered plan,
and the strongest signal in the UI is a warm-toned "(time passed)". Footer
disclaimer: note-taking aid, not medical advice; follow the doctor's and the
leaflet's instructions.

### 3.8 Tech (per APPNEST_TOOLKIT.md - no deviations)

Copy Febra's `server.js`/`app.js`/`style.css` spines: security headers, static
whitelist, rate limiting (3 trackers/h, 120 req/15 min), `readBody`/`cleanStr`,
atomic writes, re-load-before-mutate, hourly purge; IIFE client, `store`
wrapper, textContent-only rendering, EN+HR `I18N`/`t()`, theme + language
toggles; `test.js` static + spawned-server e2e. **Port 3002**,
`doza.appnest.online`, systemd unit `doza.service` with
`ReadWritePaths=/home/deploy/apps/doza/data`. localStorage keys `doza:*`.
Privacy dialog: what's stored (medicines, doses, times, notes, optional tracker
name), EU server, erased 10 days after last entry (60 days max), Caddy logs
~30 days, delete any entry yourself.

---

## 4. Open questions for the owner

1. TTL 10 days / 60-day cap OK? (§3.1)
2. Planned-interval cap at 72 h, single "every N hours" field (an "every N
   days" alternative was rejected to keep the form lean)? (§3.3)
3. Dedicated "given by" field (initials) instead of using the note? (§3.3)
4. Interval presets (4/6/8/12/24 h chips) or course templates? v1 relies on
   quick-fill chips learning the user's own combos instead. (§3.4)
5. A pre-expiry "copy/print your summary" nudge for courses approaching the
   60-day cap? (§3.1, §2.3)
6. Logo: capsule motif OK, or prefer a pill-bottle / blister-pack mark?
   Forest-green accent OK? (§1)
