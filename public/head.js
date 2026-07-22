/* Doza - runs BEFORE the stylesheet so the very first paint is already in the
   saved theme and language, with no flash-of-wrong-content.

   Why a separate file: the strict CSP (default-src 'self', no 'unsafe-inline')
   blocks inline <script> and inline styles - so this ships as an external
   same-origin script and applies styles through the CSSOM (element.style),
   which the CSP allows. Keep it tiny and in sync with app.js. */
(function () {
  'use strict';
  var el = document.documentElement;

  var theme = null, lang = null;
  try {
    theme = localStorage.getItem('doza:theme');
    lang = localStorage.getItem('doza:lang');
  } catch (e) { /* private mode / blocked storage - fall through to defaults */ }

  // theme: 'light' | 'dark' | null (follow system) - mirror app.js exactly.
  // Setting data-theme now means CSS paints the right colours on first paint
  // instead of flashing the OS theme until app.js runs.
  if (theme === 'light' || theme === 'dark') el.dataset.theme = theme;
  var dark = (theme === 'light' || theme === 'dark')
    ? theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;

  // language: first visit follows the browser, defaulting to English.
  if (lang !== 'en' && lang !== 'hr') {
    lang = (navigator.language || '').toLowerCase().indexOf('hr') === 0 ? 'hr' : 'en';
  }
  el.lang = lang;

  // The HTML ships with English text baked in; app.js swaps it to the saved
  // language once the DOM exists. Hide the document until then so that swap
  // (and the stylesheet finishing loading) never shows as a flicker. Pin the
  // canvas colour to the resolved theme so the brief gap is a calm solid
  // background, not a white blink. app.js clears both once it has localized.
  el.style.colorScheme = dark ? 'dark' : 'light';
  el.style.visibility = 'hidden';

  // Safety net: if app.js fails to load or throws before revealing, never
  // leave a blank page. DOMContentLoaded fires after app.js has run, so in the
  // normal case app.js has already revealed and this is a harmless no-op.
  document.addEventListener('DOMContentLoaded', function () {
    el.style.visibility = '';
    el.style.colorScheme = '';
  });
})();
