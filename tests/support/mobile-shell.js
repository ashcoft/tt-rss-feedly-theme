const fs = require('node:fs');

// Each stylesheet starts with a relative `@import` of the shared flat-ttrss base.
// Inlining the sheet into an about:blank page would drop that import, so the base
// is resolved explicitly and prepended. Every path is a literal and every call is
// static, so no file path is assembled from a variable.
const readFlatBase = (href) => {
  if (href === '../lib/flat-ttrss/flat_combined.css') {
    return fs.readFileSync('tt-rss/lib/flat-ttrss/flat_combined.css', 'utf8');
  }
  if (href === '../lib/flat-ttrss/flat_combined_dark.css') {
    return fs.readFileSync('tt-rss/lib/flat-ttrss/flat_combined_dark.css', 'utf8');
  }
  if (href === '../lib/flat-ttrss/flat_combined_dark_blue.css') {
    return fs.readFileSync('tt-rss/lib/flat-ttrss/flat_combined_dark_blue.css', 'utf8');
  }
  return '';
};

const IMPORT_RE = /@import\s+(?:url\()?["']([^"']+)["']\)?[^;]*;/g;

const inlineImports = (css) =>
  css.replace(IMPORT_RE, (match, href) => {
    const base = readFlatBase(href);
    return base || match;
  });

// Stylesheets under test. The theme CSS is produced by `pnpm run build`; the core
// themes live in the tt-rss submodule.
const SHEETS = [
  { name: 'light', css: () => inlineImports(fs.readFileSync('tt-rss/themes/light.css', 'utf8')) },
  { name: 'night', css: () => inlineImports(fs.readFileSync('tt-rss/themes/night.css', 'utf8')) },
  { name: 'compact', css: () => inlineImports(fs.readFileSync('tt-rss/themes/compact.css', 'utf8')) },
  { name: 'feedly', css: () => inlineImports(fs.readFileSync('feedly.css', 'utf8')) },
  { name: 'feedly-night', css: () => inlineImports(fs.readFileSync('feedly_night.css', 'utf8')) },
];

// The theme variants and the bundled core themes share one mobile contract.
const SHEET_NAMES = SHEETS.map((sheet) => sheet.name);

const readSheet = (name) => {
  const sheet = SHEETS.find((candidate) => candidate.name === name);
  if (!sheet) throw new Error(`unknown stylesheet: ${name}`);
  return sheet.css();
};

// Mimics the dijit BorderContainer shell of tt-rss index.php closely enough that
// the responsive rules apply: #feeds-holder is a region=leading pane whose inline
// width dijit rewrites, and the article panes are absolutely positioned children.
// The inline styles here reproduce what dijit sets at runtime; the stylesheet
// under test then overrides them exactly as it does in the real app.
const buildShell = ({ stylesheet } = {}) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${readSheet(stylesheet)}
html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
#toolbar { display: flex; align-items: center; height: 44px; box-sizing: border-box; }
#toolbar-frame { height: 44px; }
</style>
</head>
<body class="flat ttrss_main ttrss_index">
<div id="main" style="position:absolute;width:100%;height:100%">
  <div id="feeds-holder-backdrop" data-testid="feeds-backdrop"></div>
  <div id="feeds-holder" style="position:absolute;left:0;top:0;height:100%;width:20%">
    <div id="feedTree"><div class="dijitTreeContainer"><div class="dijitTreeRow">Feed A</div></div></div>
  </div>
  <div id="content-wrap" style="position:absolute;left:20%;top:0;right:0;bottom:0">
    <div id="toolbar-frame" style="position:absolute;left:0;top:0;right:0">
      <div id="toolbar">
        <img class="sidebar-toggle" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
             alt="" role="button" tabindex="0" aria-expanded="false"
             data-testid="sidebar-toggle">
      </div>
    </div>
    <div id="headlines-wrap-inner" style="position:absolute;left:0;top:44px;right:0;bottom:0">
      <div id="headlines-frame" style="position:absolute;left:0;top:0;right:0;bottom:0;overflow-y:auto">
        <div class="whiteBox">Headline row</div>
      </div>
      <div id="content-insert" style="position:absolute;left:0;bottom:0;right:0;height:50%"></div>
    </div>
  </div>
</div>
</body>
</html>`;

// Drives the shell the way App.toggleSidebar() does, so the assertions exercise
// the same class contract the core JS relies on rather than a bespoke mock.
// The stylesheet is inlined so the page needs no server and no file:// subresource.
const initShell = async (page, { stylesheet, width = 390, height = 844 } = {}) => {
  await page.setViewportSize({ width, height });
  await page.setContent(buildShell({ stylesheet }), { waitUntil: 'load' });
  await page.evaluate(() => {
    const toggle = document.querySelector('.sidebar-toggle');
    toggle.addEventListener('click', () => {
      const open = !document.body.classList.contains('feeds-drawer-open');
      document.body.classList.toggle('feeds-drawer-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    const backdrop = document.getElementById('feeds-holder-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        document.body.classList.remove('feeds-drawer-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    }
  });
};

const readLayout = (page) =>
  page.evaluate(() => {
    const main = document.getElementById('main');
    const toggle = document.querySelector('.sidebar-toggle');
    const holder = document.getElementById('feeds-holder');
    const wrap = document.getElementById('content-wrap');
    const mainStyle = getComputedStyle(main);
    const holderStyle = getComputedStyle(holder);
    const wrapStyle = getComputedStyle(wrap);
    return {
      mainOverflowX: mainStyle.overflowX,
      mainScrollSnapType: mainStyle.scrollSnapType,
      mainScrollLeft: main.scrollLeft,
      mainScrollWidth: main.scrollWidth,
      mainClientWidth: main.clientWidth,
      toggleDisplay: getComputedStyle(toggle).display,
      toggleAriaExpanded: toggle.getAttribute('aria-expanded'),
      holderPosition: holderStyle.position,
      holderTransform: holderStyle.transform,
      holderRect: holder.getBoundingClientRect().toJSON(),
      wrapScrollSnapAlign: wrapStyle.scrollSnapAlign,
      wrapRect: wrap.getBoundingClientRect().toJSON(),
      drawerOpen: document.body.classList.contains('feeds-drawer-open'),
    };
  });

// Mirrors the recommended toggle_sidebar plugin (Feeds.toggle()), which shows and
// hides #feeds-holder. On the docked layout that just narrows the sidebar; on a
// carousel layout it changes #main's scrollable width, which is what re-snaps it.
const toggleFeedsHolder = (page) =>
  page.evaluate(() => {
    const holder = document.getElementById('feeds-holder');
    holder.style.display = holder.style.display === 'none' ? '' : 'none';
  });

const translateX = (transform) => {
  const match = /matrix\(([^)]+)\)/.exec(transform);
  return match ? Number(match[1].split(',')[4]) : 0;
};

module.exports = {
  SHEET_NAMES,
  buildShell,
  initShell,
  readLayout,
  toggleFeedsHolder,
  translateX,
};
