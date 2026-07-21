/* Doza client. Vanilla JS, no dependencies. */
'use strict';

(() => {
  const $ = (id) => document.getElementById(id);

  // localStorage can throw (private browsing, blocked cookies, full quota).
  // Preferences are nice-to-have - a storage failure must never break the app.
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    remove(k) { try { localStorage.removeItem(k); } catch {} },
  };

  /* ================= i18n ================= */
  // Static markup carries data-i18n keys; dynamic strings go through t().
  // Parameterised entries are functions so word order can differ per language.

  const I18N = {
    en: {
      docTitle: 'Doza - track a course of medication together',
      tagline: 'medication log you can share',
      heroTitle: 'One course of medication, everyone on the same page.',
      lede: 'Log every dose of antibiotics, painkillers or drops. Instantly see how long ago the last dose was and when the next one is due. For shared care, share the link with another person - no account, no app, nothing to install.',
      btnCreate: 'Create a tracker',
      recentTitle: 'Your recent trackers on this device:',
      how1Title: 'Get a private link',
      how1Body: "One click gives you a random link. Bookmark it or send it to yourself - it's the only key to your data.",
      how2Title: 'Log each dose',
      how2Body: "Medicine, dose, time. Medicines and doses you've used before come back as a ready-made template, so you never type them twice.",
      how3Title: 'Share & summarise',
      how3Body: 'Everyone opens the same link and sees the same log - so you avoid missed or extra doses. One click builds a plain-text summary for the follow-up visit.',
      privateTitle: 'Private by design.',
      privateBody: 'No accounts, no names required. Links are unguessable random codes.',
      tempTitle: 'Temporary by design.',
      tempBody: 'A tracker is kept for 10 days after its last entry (60 days at most), then everything is permanently erased.',
      disclaimer: 'Doza is a note-taking aid, not medical advice. Always follow the dose and schedule from your doctor and the medicine leaflet.',
      copyLink: 'Copy link',
      summaryBtn: 'Summary for doctor',
      statusTitle: 'Medicines',
      newEntry: 'New entry',
      quickFill: 'Quick entry:',
      lblMed: 'Medicine',
      lblDose: 'Dose',
      lblInterval: 'Repeats every (hours)',
      lblTime: 'Time',
      lblEditable: '(editable)',
      lblNote: 'Note',
      lblOptional: '(optional)',
      addEntry: 'Add entry',
      chartTitle: 'Timeline',
      logTitle: 'Log',
      logEmpty: 'No entries yet - it takes ten seconds. Your log will look like this:',
      exampleTag: 'example',
      exampleMed: 'Amoxicillin',
      exampleDelta: '+8 h 10 min after last Amoxicillin',
      goneTitle: "This tracker doesn't exist or has expired",
      goneBody: 'Trackers are erased 10 days after their last entry. If you need a new one, create it below.',
      goneBtn: 'Create a new tracker',
      summaryModalTitle: 'Summary for the doctor',
      copyText: 'Copy text',
      printBtn: 'Print',
      footer: 'Doza - no accounts, data auto-erased after 10 days of inactivity.',
      moreTools: 'More tools from the same family:',
      moreFebra: 'Febra - child fever & medication tracker',
      moreTensio: 'Tensio - blood pressure diary',
      moreMena: 'Mena - period & cycle tracker',
      support: 'Support Doza',
      privacyLink: 'Privacy',
      privacyTitleModal: 'Privacy',
      priv1: 'What is stored: the entries you type (medicine, dose, time, note) and, if you add one, the tracker name. Nothing else - no accounts, no analytics, no cookies, no third-party services.',
      priv2: "Where and for how long: on our server in the EU, reachable only through your tracker's random link. Everything is permanently erased 10 days after the last entry (60 days at most).",
      priv3: 'Technical logs: like almost every website, the server keeps standard access logs (IP address and requested address) for up to 30 days, used only for protection against abuse.',
      priv4: 'Your control: delete any entry yourself, or simply let the tracker expire - nothing is kept afterwards.',
      aboutLink: 'About',
      aboutTitle: 'Who makes this',
      aboutBody: "My name is Ivan, and I'm an independent developer. I built these tools first of all for myself and the people close to me, but I decided to share them with everyone, free. The family started with Febra - created so my wife and I could track our sick child's temperature and medicines together. Tensio and Doza came later, at others' suggestion. I hope health serves you and us well, and that you need these tools as little as possible.",
      phMed: 'e.g. Amoxicillin',
      phDose: 'e.g. 250 mg/5 ml',
      phNote: 'e.g. with food, half a tablet, right eye',
      phName: 'e.g. Luka - amoxicillin, 7 days',
      phTime12: 'mm/dd/yyyy 2:30 PM',
      phTime24: 'dd.mm.yyyy 14:30',
      nameEditTitle: 'Click to edit',
      addNamePrompt: '+ Add a name for this tracker (e.g. who is taking the medicine)',
      deltaLess: 'less than a minute',
      deltaDays: 'days',
      today: 'Today',
      yesterday: 'Yesterday',
      weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      keptUntil: (d) => `kept until ${d}`,
      statusLast: (delta, time) => `last dose ${delta} ago (at ${time})`,
      statusDoses24: (n) => `${n} dose${n === 1 ? '' : 's'} in the last 24 h`,
      statusNext: (time) => `next ≈ ${time}`,
      statusPassed: '(time passed)',
      afterAnyMed: (delta, med) => `+${delta} after last medication (${med})`,
      afterSameMed: (delta, med) => `+${delta} after last ${med}`,
      deleteConfirm: 'Delete this entry?',
      deleteTitle: 'Delete this entry',
      fillMedDose: 'Fill medicine, dose and plan',
      timeErr12: 'Time must look like 07/03/2026 2:30 PM (mm/dd/yyyy h:MM AM/PM).',
      timeErr24: 'Time must look like 24.12.2026 14:30 (dd.mm.yyyy HH:MM).',
      errTimeFuture: 'That time is in the future. Log the entry with the current time or earlier.',
      errTimePast: 'You can backdate an entry at most 10 days. Choose a more recent time.',
      errMed: 'Enter the medicine name.',
      errInterval: '"Repeats every" must be a whole number of hours between 1 and 72.',
      toastAdded: 'Entry added',
      toastCopied: 'Link copied - share it with the other caregiver',
      toastNothing: 'Nothing to summarise yet.',
      toastSummaryCopied: 'Summary copied',
      toastCopyFail: 'Could not copy - select the text manually.',
      reqFailed: (s) => `Request failed (${s})`,
      expiryUrgent: (delta, dt, extra) => `This tracker will be permanently erased in ${delta} (${dt}).${extra}`,
      urgentCapped: ' It has reached its maximum age of 60 days and cannot be extended.',
      urgentExtend: ' Add an entry to keep it for 10 more days.',
      expiryCapped: (dt) => `Data is kept until ${dt} - this tracker has reached its maximum age of 60 days and cannot be extended further. After that date everything is permanently erased.`,
      expiryNormal: (dt) => `Data is kept until ${dt} - every new entry extends this by 10 days (60 days maximum in total). After that, everything is permanently erased.`,
      sumTitle: 'MEDICATION LOG',
      sumFor: (n) => `For: ${n}`,
      sumGenerated: (dt) => `Generated: ${dt}`,
      sumPeriod: (a, b) => `Period: ${a} – ${b}`,
      sumDays: (n) => `Days covered: ${n}`,
      sumPerMed: 'PER MEDICINE',
      sumMedCount: (n) => `${n} dose${n === 1 ? '' : 's'}`,
      sumMedFirstLast: (a, b) => `first ${a}, last ${b}`,
      sumMedAvg: (delta) => `average gap ${delta}`,
      sumMedLongest: (delta) => `longest gap ${delta}`,
      sumMedPlan: (n) => `plan: every ${n} h`,
      sumTimeline: 'TIMELINE',
      sumAfterPrev: (delta, med) => `(${delta} after previous ${med})`,
    },
    hr: {
      docTitle: 'Doza - zajedničko bilježenje doza lijekova',
      tagline: 'dnevnik lijekova koji možete podijeliti',
      heroTitle: 'Jedna terapija, svi u toku.',
      lede: 'Zabilježite svaku dozu antibiotika, lijekova protiv boli ili kapi. Odmah vidite koliko je prošlo od posljednje doze i kada je planirana sljedeća. Za zajedničku brigu podijelite poveznicu s drugom osobom - bez računa, bez aplikacije, bez instalacije.',
      btnCreate: 'Napravi dnevnik',
      recentTitle: 'Vaši nedavni dnevnici na ovom uređaju:',
      how1Title: 'Zatražite privatnu poveznicu',
      how1Body: 'Jednim klikom dobijete nasumičnu poveznicu. Istu dodajte u favorite ili pošaljite sebi - to je jedini ključ za vaše podatke.',
      how2Title: 'Zabilježite svaku dozu',
      how2Body: 'Lijek, doza, vrijeme. Lijekove i doze koje ste već unosili nudimo kao predložak za unos, pa ih ne morate ponovno tipkati.',
      how3Title: 'Podijelite i napravite sažetak',
      how3Body: 'Svi otvaraju istu poveznicu i vide iste zapise - time izbjegavate propuštanje doza ili davanje doza viška. Jednim klikom nastaje sažetak za kontrolni pregled.',
      privateTitle: 'Anonimno.',
      privateBody: 'Bez računa, bez potrebe za imenom. Poveznice su nasumični kodovi koje je nemoguće pogoditi.',
      tempTitle: 'Vremenski ograničeno.',
      tempBody: 'Dnevnik se čuva 10 dana nakon zadnjeg unosa (najviše 60 dana), zatim se sve trajno briše.',
      disclaimer: 'Doza je pomoć za bilježenje, a ne medicinski savjet. Uvijek se držite doze i rasporeda koje je odredio liječnik te upute o lijeku.',
      copyLink: 'Kopiraj poveznicu',
      summaryBtn: 'Sažetak za liječnika',
      statusTitle: 'Lijekovi',
      newEntry: 'Novi unos',
      quickFill: 'Brzi unos:',
      lblMed: 'Lijek',
      lblDose: 'Doza',
      lblInterval: 'Ponavlja se svakih (sati)',
      lblTime: 'Vrijeme',
      lblEditable: '(moguće urediti)',
      lblNote: 'Bilješka',
      lblOptional: '(nije obavezno)',
      addEntry: 'Dodaj unos',
      chartTitle: 'Vremenski slijed',
      logTitle: 'Zapis',
      logEmpty: 'Još nema unosa. Vaš zapis izgledat će ovako:',
      exampleTag: 'primjer',
      exampleMed: 'Amoksicilin',
      exampleDelta: '+8 h 10 min nakon zadnjeg Amoksicilina',
      goneTitle: 'Ovaj dnevnik ne postoji ili je istekao',
      goneBody: 'Dnevnici se brišu 10 dana nakon zadnjeg unosa. Ako trebate novi, napravite ga ispod.',
      goneBtn: 'Napravi novi dnevnik',
      summaryModalTitle: 'Sažetak za liječnika',
      copyText: 'Kopiraj tekst',
      printBtn: 'Ispiši',
      footer: 'Doza - bez računa, podaci se automatski brišu nakon 10 dana neaktivnosti.',
      moreTools: 'Još alata iz iste obitelji:',
      moreFebra: 'Febra - bilježenje dječje temperature i terapije',
      moreTensio: 'Tensio - dnevnik krvnog tlaka',
      moreMena: 'Mena - dnevnik menstruacije i ciklusa',
      support: 'Podrži Dozu',
      privacyLink: 'Privatnost',
      privacyTitleModal: 'Privatnost',
      priv1: 'Što se sprema: unosi koje upišete (lijek, doza, vrijeme, bilješka) i, ako ga dodate, naziv dnevnika. Ništa drugo - bez računa, bez analitike, bez kolačića, bez trećih strana.',
      priv2: 'Gdje i koliko dugo: na našem poslužitelju u EU, dostupno samo preko nasumične poveznice vašeg dnevnika. Sve se trajno briše 10 dana nakon zadnjeg unosa (najviše 60 dana).',
      priv3: 'Tehnički zapisi: kao i gotovo svaka web stranica, poslužitelj čuva standardne pristupne zapise (IP adresa i tražena adresa) do 30 dana, isključivo radi zaštite od zlouporabe.',
      priv4: 'Vaša kontrola: sami izbrišite bilo koji unos ili jednostavno pustite da dnevnik istekne - nakon toga ništa ne ostaje.',
      aboutLink: 'O autoru',
      aboutTitle: 'Tko stoji iza alata',
      aboutBody: 'Zovem se Ivan, samostalni sam programer. Ove alate izradio sam prvenstveno za sebe i svoje bližnje, no odlučio sam ih besplatno podijeliti sa svima. Obitelj alata započela je s Febrom - nastalom kako bi supruga i ja mogli zajedno pratiti temperaturu i terapiju bolesnog djeteta. Tensio i Doza nastali su na prijedlog ostalih. Nadam se da će vas i nas zdravlje poslužiti i da će vam ovi alati biti što manje potrebni.',
      phMed: 'npr. Amoksicilin',
      phDose: 'npr. 250 mg/5 ml',
      phNote: 'npr. uz obrok, pola tablete, desno oko',
      phName: 'npr. Luka - amoksicilin, 7 dana',
      phTime12: 'mm/dd/gggg 2:30 PM',
      phTime24: 'dd.mm.gggg 14:30',
      nameEditTitle: 'Kliknite za uređivanje',
      addNamePrompt: '+ Dodaj naziv dnevnika (npr. tko prima lijek)',
      deltaLess: 'manje od minute',
      deltaDays: 'dana',
      today: 'Danas',
      yesterday: 'Jučer',
      weekdays: ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota'],
      keptUntil: (d) => `čuva se do ${d}`,
      statusLast: (delta, time) => `zadnja doza prije ${delta} (u ${time})`,
      statusDoses24: (n) => {
        const m10 = n % 10, m100 = n % 100;
        const w = m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14) ? 'doze' : 'doza';
        return `${n} ${w} u zadnja 24 h`;
      },
      statusNext: (time) => `sljedeća ≈ ${time}`,
      statusPassed: '(vrijeme prošlo)',
      afterAnyMed: (delta, med) => `+${delta} nakon zadnjeg lijeka (${med})`,
      afterSameMed: (delta, med) => `+${delta} nakon zadnjeg ${med}`,
      deleteConfirm: 'Izbrisati ovaj unos?',
      deleteTitle: 'Izbriši ovaj unos',
      fillMedDose: 'Popuni lijek, dozu i plan',
      timeErr12: 'Vrijeme mora izgledati kao 07/03/2026 2:30 PM (mm/dd/gggg h:MM AM/PM).',
      timeErr24: 'Vrijeme mora izgledati kao 24.12.2026 14:30 (dd.mm.gggg HH:MM).',
      errTimeFuture: 'To vrijeme je u budućnosti. Unesite trenutačno vrijeme ili ranije.',
      errTimePast: 'Unos možete unatrag datirati najviše 10 dana. Odaberite noviji trenutak.',
      errMed: 'Unesite naziv lijeka.',
      errInterval: '"Ponavlja se svakih" mora biti cijeli broj sati između 1 i 72.',
      toastAdded: 'Unos dodan',
      toastCopied: 'Poveznica kopirana - podijelite ju s drugom osobom koja daje lijekove',
      toastNothing: 'Još nema što sažeti.',
      toastSummaryCopied: 'Sažetak kopiran',
      toastCopyFail: 'Kopiranje nije uspjelo - označite tekst ručno.',
      reqFailed: (s) => `Zahtjev nije uspio (${s})`,
      expiryUrgent: (delta, dt, extra) => `Ovaj dnevnik će se trajno izbrisati za ${delta} (${dt}).${extra}`,
      urgentCapped: ' Dosegnuo je najveću starost od 60 dana i ne može se produžiti.',
      urgentExtend: ' Dodajte unos da ga zadržite još 10 dana.',
      expiryCapped: (dt) => `Podaci se čuvaju do ${dt} - ovaj dnevnik je dosegnuo najveću starost od 60 dana i ne može se dalje produžiti. Nakon toga se sve trajno briše.`,
      expiryNormal: (dt) => `Podaci se čuvaju do ${dt} - svaki novi unos produžuje to za 10 dana (najviše 60 dana ukupno). Nakon toga se sve trajno briše.`,
      sumTitle: 'DNEVNIK LIJEKOVA',
      sumFor: (n) => `Za: ${n}`,
      sumGenerated: (dt) => `Izrađeno: ${dt}`,
      sumPeriod: (a, b) => `Razdoblje: ${a} – ${b}`,
      sumDays: (n) => `Obuhvaćeno dana: ${n}`,
      sumPerMed: 'PO LIJEKU',
      sumMedCount: (n) => {
        const m10 = n % 10, m100 = n % 100;
        const w = m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14) ? 'doze' : 'doza';
        return `${n} ${w}`;
      },
      sumMedFirstLast: (a, b) => `prva ${a}, zadnja ${b}`,
      sumMedAvg: (delta) => `prosječni razmak ${delta}`,
      sumMedLongest: (delta) => `najduži razmak ${delta}`,
      sumMedPlan: (n) => `plan: na ${n} h`,
      sumTimeline: 'VREMENSKI SLIJED',
      sumAfterPrev: (delta, med) => `(${delta} nakon prethodnog ${med})`,
    },
  };

  let lang = store.get('doza:lang');
  if (lang !== 'en' && lang !== 'hr') {
    lang = (navigator.language || '').toLowerCase().startsWith('hr') ? 'hr' : 'en';
  }

  function t(key, ...args) {
    const table = I18N[lang] || I18N.en;
    let v = table[key];
    if (v === undefined) v = I18N.en[key];
    if (v === undefined) return key;
    return typeof v === 'function' ? v(...args) : v;
  }

  function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $('f-med').placeholder = t('phMed');
    $('f-dose').placeholder = t('phDose');
    $('f-note').placeholder = t('phNote');
    $('name-input').placeholder = t('phName');
    $('name-display').title = t('nameEditTitle');
    document.title = t('docTitle');
    document.documentElement.lang = lang;
  }

  /* ================= theme ================= */
  // 'light' | 'dark' | null (follow system). data-theme on <html> overrides
  // the CSS media query; the buttons highlight the *effective* theme.

  let theme = store.get('doza:theme');
  if (theme !== 'light' && theme !== 'dark') theme = null;

  function effectiveTheme() {
    if (theme) return theme;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme() {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    const eff = effectiveTheme();
    $('theme-light').classList.toggle('on', eff === 'light');
    $('theme-dark').classList.toggle('on', eff === 'dark');
  }

  function setTheme(next) {
    theme = next;
    store.set('doza:theme', next);
    applyTheme();
  }

  /* ================= views ================= */

  const views = {
    landing: $('view-landing'),
    tracker: $('view-tracker'),
    gone: $('view-gone'),
  };
  let activeView = null;

  function show(name) {
    activeView = name;
    for (const [k, el] of Object.entries(views)) el.hidden = k !== name;
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._h);
    toast._h = setTimeout(() => { el.hidden = true; }, 2600);
  }

  /* ---------------- formatting helpers ---------------- */

  const pad = (n) => String(n).padStart(2, '0');

  // 12h/24h clock preference: '24' → dd.mm.yyyy + HH:MM, '12' → mm/dd/yyyy + AM/PM.
  let clock = store.get('doza:clock');
  if (clock !== '12' && clock !== '24') {
    // no explicit choice yet: follow the language (HR → 24h, EN → 12h);
    // the 12h/24h toggle still overrides this and is remembered.
    clock = lang === 'hr' ? '24' : '12';
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    const h = d.getHours();
    if (clock === '12') return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
    return `${pad(h)}:${pad(d.getMinutes())}`;
  }

  function fmtDate(d) {
    return clock === '12'
      ? `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
      : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}.`;
  }

  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  function shortDate(ts) {
    const d = new Date(ts);
    return clock === '12' ? `${d.getMonth() + 1}/${d.getDate()}` : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
  }

  function fmtDay(ts) {
    const d = new Date(ts);
    const today = new Date();
    const yest = new Date(today.getTime() - 864e5);
    if (sameDay(d, today)) return `${t('today')}, ${fmtDate(d)}`;
    if (sameDay(d, yest)) return `${t('yesterday')}, ${fmtDate(d)}`;
    return `${t('weekdays')[d.getDay()]}, ${fmtDate(d)}`;
  }

  // like fmtDay, but always the real weekday name - used in the doctor
  // summary, which may be read days later, where "Today"/"Yesterday" would
  // be stale or misleading
  function fmtDayAbsolute(ts) {
    const d = new Date(ts);
    return `${t('weekdays')[d.getDay()]}, ${fmtDate(d)}`;
  }

  function fmtDateTime(ts) {
    return `${fmtDate(new Date(ts))} ${fmtTime(ts)}`;
  }

  function fmtDelta(ms) {
    const mins = Math.round(ms / 60000);
    if (mins < 1) return t('deltaLess');
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (h < 48) return m ? `${h} h ${m} min` : `${h} h`;
    return `${Math.floor(h / 24)} ${t('deltaDays')} ${h % 24} h`;
  }

  /* ---------------- time input (masked text, 12h or 24h) ---------------- */

  function to24InputValue(date) {
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function to12InputValue(date) {
    const h = date.getHours();
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()} ${h % 12 || 12}:${pad(date.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
  }

  function checkedDate(yyyy, mm, dd, hh, mi) {
    if (hh > 23 || mi > 59) return null;
    const d = new Date(yyyy, mm - 1, dd, hh, mi);
    if (d.getDate() !== dd || d.getMonth() !== mm - 1) return null;
    return d.getTime();
  }

  function parse24(s) {
    const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s+(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const [, dd, mm, yyyy, hh, mi] = m.map(Number);
    return checkedDate(yyyy, mm, dd, hh, mi);
  }

  function parse12(s) {
    const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    const mm = Number(m[1]), dd = Number(m[2]), yyyy = Number(m[3]);
    let hh = Number(m[4]);
    const mi = Number(m[5]);
    if (hh < 1 || hh > 12) return null;
    hh = hh % 12 + (m[6].toUpperCase() === 'PM' ? 12 : 0);
    return checkedDate(yyyy, mm, dd, hh, mi);
  }

  function setFormTime(date) {
    $('f-time').value = clock === '12' ? to12InputValue(date) : to24InputValue(date);
  }

  function getFormTs() {
    const v = $('f-time').value.trim();
    if (!v) return { ts: Date.now() };
    const ts = clock === '12' ? parse12(v) : parse24(v);
    if (ts !== null) return { ts };
    return { error: clock === '12' ? t('timeErr12') : t('timeErr24') };
  }

  function applyClock() {
    $('clock-12').classList.toggle('on', clock === '12');
    $('clock-24').classList.toggle('on', clock === '24');
    $('clock-12').setAttribute('aria-pressed', clock === '12');
    $('clock-24').setAttribute('aria-pressed', clock === '24');
    $('f-time').placeholder = clock === '12' ? t('phTime12') : t('phTime24');
  }

  function switchClock(next) {
    if (next === clock) return;
    const current = getFormTs();
    clock = next;
    store.set('doza:clock', clock);
    setFormTime(new Date(current.error ? Date.now() : current.ts));
    applyClock();
    renderExpiry();
    renderStatus();
    renderLog();
    renderChart();
  }

  /* ---------------- API ---------------- */

  async function api(pathname, opts) {
    const res = await fetch(pathname, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    let body = null;
    try { body = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error((body && body.error) || t('reqFailed', res.status));
      err.status = res.status;
      throw err;
    }
    return body;
  }

  /* ---------------- recent trackers (this device only) ---------------- */

  function loadRecent() {
    let list = [];
    try { list = JSON.parse(store.get('doza:recent')) || []; } catch {}
    if (!Array.isArray(list)) list = [];
    // self-heal: expired/malformed entries are pruned from storage right here,
    // so a dead link disappears on the next page load - the user never has to
    // click it. (A tracker purged server-side before its local expiry still
    // gets removed via forgetTracker() on the 404 when opened - the backstop.)
    const valid = list.filter((x) => x && x.id && Date.now() < x.expiresAt);
    if (valid.length !== list.length) {
      store.set('doza:recent', JSON.stringify(valid.slice(0, 5)));
    }
    return valid;
  }

  function saveRecent(list) {
    store.set('doza:recent', JSON.stringify(list.slice(0, 5)));
  }

  function rememberTracker(id, expiresAt, name) {
    const list = loadRecent().filter((x) => x.id !== id);
    list.unshift({ id, expiresAt, name: name || '' });
    saveRecent(list);
  }

  function forgetTracker(id) {
    saveRecent(loadRecent().filter((x) => x.id !== id));
  }

  function renderRecent() {
    const recent = loadRecent();
    const box = $('recent-box');
    const ul = $('recent-list');
    ul.innerHTML = '';
    box.hidden = recent.length === 0;
    for (const r of recent) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `/t/${r.id}`;
      a.textContent = r.name || `${location.host}/t/${r.id}`;
      a.title = `${location.host}/t/${r.id}`;
      const exp = document.createElement('span');
      exp.className = 'recent-exp';
      exp.textContent = t('keptUntil', fmtDate(new Date(r.expiresAt)));
      li.append(a, exp);
      ul.appendChild(li);
    }
  }

  /* ---------------- landing view ---------------- */

  function initLanding() {
    show('landing');
    renderRecent();

    $('btn-create').addEventListener('click', async () => {
      const btn = $('btn-create');
      const errEl = $('create-error');
      btn.disabled = true;
      errEl.hidden = true;
      try {
        const tr = await api('/api/new', { method: 'POST' });
        rememberTracker(tr.id, tr.expiresAt, '');
        location.href = `/t/${tr.id}`;
      } catch (e) {
        errEl.textContent = e.message;
        errEl.hidden = false;
        btn.disabled = false;
      }
    });
  }

  /* ---------------- tracker view ---------------- */

  let tracker = null;
  let trackerId = null;

  const MAX_LIFE_MS = 60 * 24 * 60 * 60 * 1000; // keep in sync with server.js
  const BACKDATE_MS = 10 * 24 * 60 * 60 * 1000;

  function computeDeltas(entries) {
    const out = new Map();
    entries.forEach((e, i) => {
      if (!e.med) return;
      let lastAny = null;
      let lastSame = null;
      for (let j = i - 1; j >= 0; j--) {
        const p = entries[j];
        if (!p.med) continue;
        if (!lastAny) lastAny = p;
        if (!lastSame && p.med.toLowerCase() === e.med.toLowerCase()) lastSame = p;
        if (lastAny && lastSame) break;
      }
      out.set(e.id, { lastAny, lastSame });
    });
    return out;
  }

  // Distinct medicines, grouped case-insensitively, in first-used order.
  // The most recent casing wins for display; entries stay sorted by ts.
  function medGroups() {
    const map = new Map();
    for (const e of tracker.entries) {
      const k = e.med.toLowerCase();
      let g = map.get(k);
      if (!g) { g = { med: e.med, entries: [] }; map.set(k, g); }
      g.entries.push(e);
      g.med = e.med;
    }
    return [...map.values()];
  }

  // the group's plan = the "repeats every" of its most recent entry that has one
  function groupPlan(g) {
    for (let i = g.entries.length - 1; i >= 0; i--) {
      const iv = g.entries[i].intervalH;
      if (iv !== null && iv !== undefined) return iv;
    }
    return null;
  }

  function renderExpiry() {
    const left = tracker.expiresAt - Date.now();
    const capped = tracker.expiresAt >= tracker.createdAt + MAX_LIFE_MS - 60_000;
    const urgent = left < 24 * 3600_000;
    $('expiry-banner').classList.toggle('urgent', urgent);
    let text;
    if (urgent) {
      text = t('expiryUrgent', fmtDelta(left), fmtDateTime(tracker.expiresAt), capped ? t('urgentCapped') : t('urgentExtend'));
    } else if (capped) {
      text = t('expiryCapped', fmtDateTime(tracker.expiresAt));
    } else {
      text = t('expiryNormal', fmtDateTime(tracker.expiresAt));
    }
    $('expiry-text').textContent = text;
  }

  // The headline feature: one row per medicine - how long ago the last dose
  // was given, how many doses fell in the rolling last 24 h (a plain count,
  // no thresholds), and, when the user entered their own "repeats every N h"
  // plan, the projected next dose. Pure arithmetic on the user's plan - Doza
  // has no drug database and issues no warnings.
  function renderStatus() {
    const list = $('status-list');
    list.innerHTML = '';
    const groups = medGroups();
    $('status-card').hidden = groups.length === 0;
    if (!groups.length) return;
    const now = Date.now();
    // most recently dosed medicine first
    groups.sort((a, b) => b.entries[b.entries.length - 1].ts - a.entries[a.entries.length - 1].ts);
    for (const g of groups) {
      const last = g.entries[g.entries.length - 1];
      const row = document.createElement('div');
      row.className = 'status-row';

      const medEl = document.createElement('div');
      medEl.className = 'status-med';
      const nameEl = document.createElement('span');
      nameEl.className = 'status-name';
      nameEl.textContent = g.med;
      medEl.appendChild(nameEl);
      // the latest dose text used for this medicine
      let doseText = '';
      for (let i = g.entries.length - 1; i >= 0; i--) {
        if (g.entries[i].dose) { doseText = g.entries[i].dose; break; }
      }
      if (doseText) {
        const doseEl = document.createElement('span');
        doseEl.className = 'status-dose';
        doseEl.textContent = doseText;
        medEl.appendChild(doseEl);
      }
      row.appendChild(medEl);

      const info = document.createElement('div');
      info.className = 'status-info';

      const lastEl = document.createElement('span');
      lastEl.className = 'status-last';
      lastEl.textContent = t('statusLast', fmtDelta(now - last.ts), fmtTime(last.ts));
      info.appendChild(lastEl);

      const in24 = g.entries.filter((e) => now - e.ts < 24 * 3600_000).length;
      const countEl = document.createElement('span');
      countEl.className = 'status-count';
      countEl.textContent = t('statusDoses24', in24);
      info.appendChild(countEl);

      const plan = groupPlan(g);
      if (plan !== null) {
        const next = last.ts + plan * 3600_000;
        const when = sameDay(new Date(next), new Date(now)) ? fmtTime(next) : `${shortDate(next)} ${fmtTime(next)}`;
        const nextEl = document.createElement('span');
        // a projected time in the past is a neutral fact, not an alert
        nextEl.className = 'status-next' + (next < now ? ' overdue' : '');
        nextEl.textContent = t('statusNext', when) + (next < now ? ' ' + t('statusPassed') : '');
        info.appendChild(nextEl);
      }

      row.appendChild(info);
      list.appendChild(row);
    }
  }

  function renderLog() {
    const list = $('log-list');
    list.innerHTML = '';
    list.classList.toggle('t12', clock === '12');
    $('log-empty').hidden = tracker.entries.length > 0;

    const deltas = computeDeltas(tracker.entries);
    const entries = [...tracker.entries].reverse();
    let currentDay = '';

    for (const e of entries) {
      const day = fmtDay(e.ts);
      if (day !== currentDay) {
        currentDay = day;
        const h = document.createElement('li');
        h.className = 'log-day';
        h.textContent = day;
        list.appendChild(h);
      }

      const li = document.createElement('li');
      li.className = 'entry';

      const time = document.createElement('div');
      time.className = 'entry-time';
      time.textContent = fmtTime(e.ts);

      const main = document.createElement('div');
      main.className = 'entry-main';

      const head = document.createElement('div');
      head.className = 'entry-head';
      const m = document.createElement('span');
      m.className = 'entry-med';
      m.textContent = e.med;
      head.appendChild(m);
      if (e.dose) {
        const dspan = document.createElement('span');
        dspan.className = 'entry-dose';
        dspan.textContent = e.dose;
        head.appendChild(dspan);
      }
      main.appendChild(head);

      const dl = deltas.get(e.id);
      if (dl && (dl.lastAny || dl.lastSame)) {
        const dd = document.createElement('div');
        dd.className = 'entry-deltas';
        if (dl.lastAny) {
          const s = document.createElement('span');
          s.textContent = t('afterAnyMed', fmtDelta(e.ts - dl.lastAny.ts), dl.lastAny.med);
          dd.appendChild(s);
        }
        if (dl.lastSame && (!dl.lastAny || dl.lastSame.id !== dl.lastAny.id)) {
          const s = document.createElement('span');
          s.textContent = t('afterSameMed', fmtDelta(e.ts - dl.lastSame.ts), e.med);
          dd.appendChild(s);
        }
        main.appendChild(dd);
      }

      if (e.note) {
        const n = document.createElement('div');
        n.className = 'entry-note';
        n.textContent = e.note;
        main.appendChild(n);
      }

      const del = document.createElement('button');
      del.className = 'entry-del';
      del.title = t('deleteTitle');
      del.textContent = '✕';
      del.addEventListener('click', async () => {
        if (!confirm(t('deleteConfirm'))) return;
        try {
          tracker = await api(`/api/t/${trackerId}/entries/${e.id}`, { method: 'DELETE' });
          renderAll();
        } catch (err) {
          toast(err.message);
        }
      });

      li.append(time, main, del);
      list.appendChild(li);
    }
  }

  function renderDatalists() {
    const meds = [...new Set(tracker.entries.filter((e) => e.med).map((e) => e.med))];
    const medList = $('med-list');
    medList.innerHTML = '';
    for (const m of meds.reverse()) {
      const o = document.createElement('option');
      o.value = m;
      medList.appendChild(o);
    }
    const doses = [...new Set(tracker.entries.filter((e) => e.dose).map((e) => e.dose))];
    const doseList = $('dose-list');
    doseList.innerHTML = '';
    for (const d of doses.reverse()) {
      const o = document.createElement('option');
      o.value = d;
      doseList.appendChild(o);
    }
  }

  function renderQuickMeds() {
    const box = $('quick-meds');
    const seen = new Set();
    const combos = [];
    const entries = tracker.entries;
    for (let i = entries.length - 1; i >= 0 && combos.length < 4; i--) {
      const e = entries[i];
      const key = `${e.med.toLowerCase()}|${e.dose.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // the combo's most recent "repeats every" plan, if any
      let intervalH = null;
      for (let j = entries.length - 1; j >= 0; j--) {
        const p = entries[j];
        if (p.med.toLowerCase() === e.med.toLowerCase()
            && p.dose.toLowerCase() === e.dose.toLowerCase()
            && p.intervalH !== null && p.intervalH !== undefined) { intervalH = p.intervalH; break; }
      }
      combos.push({ med: e.med, dose: e.dose, intervalH });
    }
    box.querySelectorAll('.quick-chip').forEach((c) => c.remove());
    box.hidden = combos.length === 0;
    for (const c of combos) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-chip';
      btn.textContent = c.dose ? `${c.med} · ${c.dose}` : c.med;
      btn.title = t('fillMedDose');
      btn.addEventListener('click', () => {
        $('f-med').value = c.med;
        $('f-dose').value = c.dose;
        $('f-interval').value = c.intervalH === null ? '' : String(c.intervalH);
        $('f-note').focus();
      });
      box.appendChild(btn);
    }
  }

  function renderName() {
    const el = $('name-display');
    if (tracker.name) {
      el.textContent = tracker.name;
      el.classList.remove('placeholder');
    } else {
      el.textContent = t('addNamePrompt');
      el.classList.add('placeholder');
    }
  }

  function renderAll() {
    renderName();
    renderExpiry();
    renderStatus();
    renderLog();
    renderDatalists();
    renderQuickMeds();
    renderChart();
    rememberTracker(trackerId, tracker.expiresAt, tracker.name);
  }

  /* ---------------- dose timeline chart ---------------- */
  // One horizontal lane per distinct medicine (first-used first), a dot per
  // dose, day separators at midnight. No values, no thresholds - the chart
  // only shows *when* doses were given, which is the whole story here.

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  function svgText(x, y, anchor, content) {
    const el = svgEl('text', { x, y, 'text-anchor': anchor, class: 'chart-label' });
    el.textContent = content;
    return el;
  }

  function buildChartSVG() {
    const es = tracker.entries;
    if (es.length < 2) return null;

    const lanes = medGroups();
    const rows = lanes.length;
    const W = 600, L = 110, R = 12, T = 40, B = 30;
    const H = T + rows * 28 + B;
    const t0 = Math.min(...es.map((e) => e.ts));
    const t1 = Math.max(...es.map((e) => e.ts));
    const span = Math.max(t1 - t0, 60_000);

    const x = (ts) => L + ((ts - t0) / span) * (W - L - R);
    const laneY = (i) => T + i * 28 + 14;

    const multiDay = !sameDay(new Date(t0), new Date(t1));
    const endLabel = (ts) => (multiDay ? `${shortDate(ts)} ${fmtTime(ts)}` : fmtTime(ts));

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': t('chartTitle') });

    // vertical day separators at each midnight in range, labelled with the
    // new day; long ranges only label every few days to stay readable
    if (multiDay) {
      const first = new Date(t0);
      first.setHours(0, 0, 0, 0);
      const days = Math.ceil((t1 - t0) / 864e5);
      const step = days > 14 ? Math.ceil(days / 10) : 1;
      let i = 0;
      for (let mid = first.getTime() + 864e5; mid < t1; mid += 864e5, i++) {
        if (i % step) continue;
        const xm = x(mid);
        svg.appendChild(svgEl('line', { x1: xm.toFixed(1), x2: xm.toFixed(1), y1: T, y2: T + rows * 28, class: 'chart-daysep' }));
        svg.appendChild(svgText(xm.toFixed(1), T - 10, 'middle', shortDate(mid)));
      }
    }

    lanes.forEach((lane, i) => {
      const yc = laneY(i);
      // faint horizontal guide for the lane
      svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: yc, y2: yc, class: 'chart-grid' }));
      // lane label in the left gutter, truncated so it never overlaps the plot
      const short = lane.med.length > 16 ? lane.med.slice(0, 15) + '…' : lane.med;
      const label = svgEl('text', { x: L - 8, y: yc + 4, 'text-anchor': 'end', class: 'chart-label chart-lane' });
      label.textContent = short;
      if (short !== lane.med) {
        const full = document.createElementNS(SVG_NS, 'title');
        full.textContent = lane.med;
        label.appendChild(full);
      }
      svg.appendChild(label);
      // a dot per dose
      for (const e of lane.entries) {
        const dot = svgEl('circle', { cx: x(e.ts).toFixed(1), cy: yc, r: 4, class: 'chart-dot' });
        const title = document.createElementNS(SVG_NS, 'title');
        title.textContent = `${fmtTime(e.ts)} · ${e.med}${e.dose ? ' ' + e.dose : ''}`;
        dot.appendChild(title);
        svg.appendChild(dot);
      }
    });

    // start / end time labels at the bottom corners
    svg.appendChild(svgText(L, H - 12, 'start', endLabel(t0)));
    svg.appendChild(svgText(W - R, H - 12, 'end', endLabel(t1)));

    return svg;
  }

  function renderChart() {
    const holder = $('chart');
    holder.innerHTML = '';
    const svg = buildChartSVG();
    $('chart-card').hidden = !svg;
    if (svg) holder.appendChild(svg);
  }

  /* ---------------- doctor summary ---------------- */
  // Per-medicine facts first (counts, first/last, gap pattern, the user's own
  // plan), then the full timeline. Facts only - no adherence judgements.

  function buildSummary() {
    const es = tracker.entries;
    const lines = [];
    lines.push(t('sumTitle'));
    if (tracker.name) lines.push(t('sumFor', tracker.name));
    lines.push(t('sumGenerated', fmtDateTime(Date.now())));
    lines.push(t('sumPeriod', fmtDateTime(es[0].ts), fmtDateTime(es[es.length - 1].ts)));
    const dayKeys = new Set(es.map((e) => { const d = new Date(e.ts); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }));
    lines.push(t('sumDays', dayKeys.size));
    lines.push('');
    lines.push(t('sumPerMed'));

    const stamp = (ts) => `${shortDate(ts)} ${fmtTime(ts)}`;
    for (const g of medGroups()) {
      const n = g.entries.length;
      // most frequent dose text, ties broken by the most recently used
      const counts = new Map();
      for (const e of g.entries) if (e.dose) counts.set(e.dose, (counts.get(e.dose) || 0) + 1);
      let doseText = '';
      let best = 0;
      for (let i = g.entries.length - 1; i >= 0; i--) {
        const d = g.entries[i].dose;
        if (d && counts.get(d) > best) { best = counts.get(d); doseText = d; }
      }
      const parts = [t('sumMedCount', n) + (doseText ? ` (${doseText})` : '')];
      if (n >= 2) {
        parts.push(t('sumMedFirstLast', stamp(g.entries[0].ts), stamp(g.entries[n - 1].ts)));
        let sum = 0;
        let longest = 0;
        for (let i = 1; i < n; i++) {
          const gap = g.entries[i].ts - g.entries[i - 1].ts;
          sum += gap;
          if (gap > longest) longest = gap;
        }
        parts.push(t('sumMedAvg', fmtDelta(sum / (n - 1))));
        parts.push(t('sumMedLongest', fmtDelta(longest)));
      } else {
        parts.push(stamp(g.entries[0].ts));
      }
      const plan = groupPlan(g);
      if (plan !== null) parts.push(t('sumMedPlan', plan));
      lines.push(`${g.med}: ${parts.join(', ')}`);
    }

    lines.push('');
    lines.push(t('sumTimeline'));

    const deltas = computeDeltas(es);
    let currentDay = '';
    for (const e of es) {
      const day = fmtDayAbsolute(e.ts);
      if (day !== currentDay) {
        currentDay = day;
        lines.push('');
        lines.push(`--- ${day} ---`);
      }
      const parts = [fmtTime(e.ts), `${e.med}${e.dose ? ' ' + e.dose : ''}`];
      const dl = deltas.get(e.id);
      if (dl && dl.lastSame) parts.push(t('sumAfterPrev', fmtDelta(e.ts - dl.lastSame.ts), e.med));
      if (e.note) parts.push(`- ${e.note}`);
      lines.push(parts.join('  '));
    }
    return lines.join('\n');
  }

  /* ---------------- tracker init ---------------- */

  async function initTracker(id) {
    trackerId = id;
    try {
      tracker = await api(`/api/t/${id}`);
    } catch (e) {
      show('gone');
      if (e.status === 404) forgetTracker(id);
      else toast(e.message);
      return;
    }

    show('tracker');
    setFormTime(new Date());
    applyClock();
    $('clock-12').addEventListener('click', () => switchClock('12'));
    $('clock-24').addEventListener('click', () => switchClock('24'));

    // inline name editing: click the title, type, Enter/blur saves
    const nameDisplay = $('name-display');
    const nameInput = $('name-input');
    const openNameEditor = () => {
      nameInput.value = tracker.name || '';
      nameDisplay.hidden = true;
      nameInput.hidden = false;
      nameInput.focus();
      nameInput.select();
    };
    const closeNameEditor = () => {
      nameInput.hidden = true;
      nameDisplay.hidden = false;
    };
    const saveName = async () => {
      const newName = nameInput.value.trim();
      if (newName === (tracker.name || '')) return closeNameEditor();
      try {
        tracker = await api(`/api/t/${trackerId}/name`, {
          method: 'PUT',
          body: JSON.stringify({ name: newName }),
        });
        renderName();
      } catch (e) {
        toast(e.message);
      }
      closeNameEditor();
    };
    nameDisplay.addEventListener('click', openNameEditor);
    nameDisplay.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openNameEditor(); });
    nameInput.addEventListener('blur', saveName);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') nameInput.blur();
      if (e.key === 'Escape') { nameInput.value = tracker.name || ''; nameInput.blur(); }
    });

    // keep the "last dose … ago" lines fresh
    setInterval(renderStatus, 30_000);

    $('entry-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errEl = $('form-error');
      errEl.hidden = true;

      const fail = (msg) => {
        errEl.textContent = msg;
        errEl.hidden = false;
      };

      const med = $('f-med').value.trim();
      const dose = $('f-dose').value.trim();
      const intervalRaw = $('f-interval').value.trim();
      const note = $('f-note').value.trim();

      if (!med) return fail(t('errMed'));

      // mirror the server: absent → null, otherwise a whole number 1–72
      let intervalH = null;
      if (intervalRaw) {
        intervalH = Number(intervalRaw);
        if (!Number.isInteger(intervalH) || intervalH < 1 || intervalH > 72) return fail(t('errInterval'));
      }

      const when = getFormTs();
      if (when.error) return fail(when.error);
      const ts = when.ts;

      // mirror the server's accepted window (5 min future / 10 days past) so
      // the user gets a clear message instead of a silent snap to "now"
      const nowMs = Date.now();
      if (ts > nowMs + 5 * 60_000) return fail(t('errTimeFuture'));
      if (ts < nowMs - BACKDATE_MS) return fail(t('errTimePast'));

      const btn = ev.target.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        tracker = await api(`/api/t/${trackerId}/entries`, {
          method: 'POST',
          body: JSON.stringify({ med, dose, intervalH, note, ts }),
        });
        renderAll();
        $('f-med').value = '';
        $('f-dose').value = '';
        $('f-interval').value = '';
        $('f-note').value = '';
        setFormTime(new Date());
        toast(t('toastAdded'));
      } catch (e) {
        fail(e.message);
      } finally {
        btn.disabled = false;
      }
    });

    $('btn-copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        toast(t('toastCopied'));
      } catch {
        prompt(t('copyLink'), location.href);
      }
    });

    $('btn-summary').addEventListener('click', () => {
      if (!tracker.entries.length) return toast(t('toastNothing'));
      $('summary-text').textContent = buildSummary();
      $('summary-modal').showModal();
    });

    $('btn-modal-close').addEventListener('click', () => $('summary-modal').close());
    $('btn-summary-copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText($('summary-text').textContent);
        toast(t('toastSummaryCopied'));
      } catch {
        toast(t('toastCopyFail'));
      }
    });
    $('btn-summary-print').addEventListener('click', () => window.print());

    // last, so a rendering failure can never leave the buttons above dead
    renderAll();
  }

  /* ---------------- language switch ---------------- */

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    store.set('doza:lang', lang);
    $('lang-en').classList.toggle('on', lang === 'en');
    $('lang-hr').classList.toggle('on', lang === 'hr');
    // date/time convention follows the language: HR → 24h + dd.mm.yyyy,
    // EN → 12h + mm/dd/yyyy. The manual 12h/24h toggle can still override after.
    const wantClock = lang === 'hr' ? '24' : '12';
    if (wantClock !== clock) {
      const keep = activeView === 'tracker' ? getFormTs() : null;
      clock = wantClock;
      store.set('doza:clock', clock);
      if (keep) setFormTime(new Date(keep.error ? Date.now() : keep.ts));
    }
    applyStaticI18n();
    applyClock();
    if (activeView === 'tracker' && tracker) {
      renderAll();
    } else if (activeView === 'landing') {
      renderRecent();
    }
  }

  /* ---------------- boot ---------------- */

  applyTheme();
  applyStaticI18n();
  // head.js hid the document and pinned the theme until we localized the
  // static chrome; now reveal it and hand styling back to CSS (see head.js).
  document.documentElement.style.visibility = '';
  document.documentElement.style.colorScheme = '';
  $('lang-en').classList.toggle('on', lang === 'en');
  $('lang-hr').classList.toggle('on', lang === 'hr');

  $('theme-light').addEventListener('click', () => setTheme('light'));
  $('theme-dark').addEventListener('click', () => setTheme('dark'));
  $('lang-en').addEventListener('click', () => setLang('en'));
  $('lang-hr').addEventListener('click', () => setLang('hr'));
  $('privacy-link').addEventListener('click', () => $('privacy-modal').showModal());
  $('btn-privacy-close').addEventListener('click', () => $('privacy-modal').close());
  $('about-link').addEventListener('click', () => $('about-modal').showModal());
  $('btn-about-close').addEventListener('click', () => $('about-modal').close());

  const m = location.pathname.match(/^\/t\/([a-zA-Z1-9]{14})$/);
  if (m) initTracker(m[1]);
  else initLanding();
})();
