const { test, expect } = require('@playwright/test');
const { SHEET_NAMES, initShell, readLayout, toggleFeedsHolder, translateX } = require('./support/mobile-shell');

// Phone portrait, a narrow phone/landscape size, a tablet size inside the theme's
// carousel range, and a desktop size above it.
const PHONE = { width: 390, height: 844 };
const NARROW = { width: 700, height: 900 };
const TABLET = { width: 900, height: 900 };
const DESKTOP = { width: 1280, height: 800 };

const isCarousel = (layout) => layout.mainScrollSnapType !== 'none';
const fitsViewport = (layout) => layout.mainScrollWidth <= layout.mainClientWidth + 1;

// The drawer slides over 0.25s; let it finish before reading geometry.
const settle = async (page) => {
  await page.waitForTimeout(400);
  return readLayout(page);
};

// Why this suite exists
// --------------------
// On the narrow layout tt-rss core turns the feed sidebar into a slide-in drawer
// driven by body.feeds-drawer-open and the .sidebar-toggle button
// (App.toggleSidebar()). The bundled core themes (light/night/compact) implement
// that model.
//
// The feedly theme additionally makes #main a two-page horizontal scroll-snap
// carousel for swiping between the feed list and the articles. That carousel used
// to run from <=992px, overlapping core's <=768px drawer layout, so on a phone
// both were active: #main was horizontally scrollable and the .sidebar-toggle
// button leaked onto the toolbar where core expects the docked layout. Any reflow
// (toggling the sidebar via the toggle_sidebar plugin, or opening the drawer)
// changed #main's scrollable width and the browser re-snapped to the feed-list
// page -- the reported "tapping the button hard/sometimes switches to the feed
// list".
//
// The carousel is now scoped to 769-992px (above the drawer breakpoint), so the
// phone cases below pass, and the tablet cases pin the carousel in place. The
// stylesheets are built by the `pretest` script, so these cases never silently skip.

test.describe('phone layout is not a horizontal carousel', () => {
  for (const name of SHEET_NAMES) {
    test(`${name}: #main does not scroll or snap horizontally`, async ({ page }) => {
      await initShell(page, { stylesheet: name, ...NARROW });
      const layout = await readLayout(page);

      expect(isCarousel(layout)).toBe(false);
      expect(fitsViewport(layout)).toBe(true);
      // The article pane must not advertise itself as a snap target either.
      expect(layout.wrapScrollSnapAlign).toBe('none');
    });
  }
});

test.describe('desktop layout keeps the docked sidebar', () => {
  for (const name of SHEET_NAMES) {
    test(`${name}: toggle hidden and #main not scrollable`, async ({ page }) => {
      await initShell(page, { stylesheet: name, ...DESKTOP });
      const layout = await readLayout(page);

      expect(layout.toggleDisplay).toBe('none');
      expect(isCarousel(layout)).toBe(false);
      expect(fitsViewport(layout)).toBe(true);
    });
  }
});

test.describe('phone layout exposes an overlay drawer', () => {
  for (const name of SHEET_NAMES) {
    test(`${name}: the toggle opens and closes the drawer`, async ({ page }) => {
      await initShell(page, { stylesheet: name, ...PHONE });
      expect((await readLayout(page)).toggleDisplay).not.toBe('none');

      await page.getByTestId('sidebar-toggle').click();
      const opened = await settle(page);
      expect(opened.drawerOpen).toBe(true);
      expect(opened.toggleAriaExpanded).toBe('true');
      // Overlay drawer: flush with the left edge of the viewport.
      expect(Math.abs(opened.holderRect.x)).toBeLessThanOrEqual(1);
      expect(translateX(opened.holderTransform)).toBeGreaterThanOrEqual(-1);

      // The open drawer covers the toolbar toggle, so close it as a user would:
      // tap the dimmed backdrop to the right of the drawer. The backdrop spans the
      // viewport, so the click position is in viewport coordinates.
      await page.getByTestId('feeds-backdrop').click({ position: { x: PHONE.width - 10, y: 400 } });
      const closed = await settle(page);
      expect(closed.drawerOpen).toBe(false);
      expect(closed.toggleAriaExpanded).toBe('false');
      expect(closed.holderRect.x).toBeLessThan(0);
    });
  }
});

test.describe('reported symptom: toggling the sidebar must not slide the view', () => {
  for (const name of SHEET_NAMES) {
    // 390px has its own sizing breakpoint (<=sm), so check it alongside 700px.
    for (const viewport of [PHONE, NARROW]) {
      test(`${name}: the article pane stays put at ${viewport.width}px`, async ({ page }) => {
        await initShell(page, { stylesheet: name, ...viewport });
        const before = await readLayout(page);

        await toggleFeedsHolder(page);
        const after = await settle(page);

        expect(after.mainScrollLeft).toBe(before.mainScrollLeft);
        expect(Math.round(after.wrapRect.x)).toBe(Math.round(before.wrapRect.x));
      });
    }
  }
});

test.describe('tablet layout keeps the swipeable carousel', () => {
  test('feedly: #main is a horizontal carousel above the drawer breakpoint', async ({ page }) => {
    await initShell(page, { stylesheet: 'feedly', ...TABLET });
    const layout = await readLayout(page);

    // The swipe gesture between feed list and articles is preserved here, and core's
    // overlay drawer is not in play at this width.
    expect(isCarousel(layout)).toBe(true);
    expect(fitsViewport(layout)).toBe(false);
    expect(layout.toggleDisplay).toBe('none');
  });

  test('feedly: the carousel boundaries sit exactly at 769px and 992px', async ({ page }) => {
    // Below the lower bound core's drawer owns the layout, so the carousel must be
    // off there -- this is the reported bug's range. Above the upper bound the
    // desktop layout takes over. Check both sides of each inclusive boundary so a
    // one-pixel drift cannot slip through.
    const expectations = [
      { width: PHONE.width, carousel: false },
      { width: NARROW.width, carousel: false },
      { width: 768, carousel: false },
      { width: 769, carousel: true },
      { width: TABLET.width, carousel: true },
      { width: 992, carousel: true },
      { width: 993, carousel: false },
    ];

    for (const { width, carousel } of expectations) {
      await initShell(page, { stylesheet: 'feedly', width, height: 900 });
      const layout = await readLayout(page);
      expect(isCarousel(layout), `at ${width}px`).toBe(carousel);
      if (!carousel) expect(fitsViewport(layout), `at ${width}px`).toBe(true);
    }
  });
});
