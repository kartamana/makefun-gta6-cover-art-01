// Panel geometry for Vice Nights: the multi-panel poster look.
// A layout is a function of the cover's pixel size, so the same layout works for a
// 1920x1080 landscape, a 1080x1080 square and a 1080x1350 portrait. Each layout returns
// the rectangles its panels occupy, in the order the editor numbers them, plus the
// rectangle the caption band sits in. Panels never overlap; the gaps between them are
// the poster's gutters, and the cover's background shows through as the frame.

export const LAYOUTS = {
  strip: 'Sunset Strip',
  grid: 'Four Corners',
  trio: 'Vice Trio',
};

export const PANEL_COUNTS = {
  strip: 3,
  grid: 4,
  trio: 3,
};

/** The gap, in pixels, between two neighbouring panels, scaled to the cover size. */
function gutter(w, h) {
  return Math.max(4, Math.round(Math.min(w, h) * 0.008));
}

/** A hero panel with two smaller panels beside or below it. */
function stripPanels(w, h) {
  const g = gutter(w, h);
  const hero = { x: 0, y: 0, w: 0, h: 0 };
  const first = { x: 0, y: 0, w: 0, h: 0 };
  const second = { x: 0, y: 0, w: 0, h: 0 };
  if (w >= h) {
    // Landscape: the hero takes the left, the two small panels stack on the right.
    const heroW = Math.round(w * 0.58);
    hero.x = 0;
    hero.y = 0;
    hero.w = heroW;
    hero.h = h;
    const sideX = heroW + g;
    const sideW = w - sideX;
    const halfH = Math.floor((h - g) / 2);
    first.x = sideX;
    first.y = 0;
    first.w = sideW;
    first.h = halfH;
    second.x = sideX;
    second.y = halfH + g;
    second.w = sideW;
    second.h = h - halfH - g;
  } else {
    // Portrait or square: the hero takes the top, the two small panels sit below.
    const heroH = Math.round(h * 0.55);
    hero.x = 0;
    hero.y = 0;
    hero.w = w;
    hero.h = heroH;
    const rowY = heroH + g;
    const rowH = h - rowY;
    const halfW = Math.floor((w - g) / 2);
    first.x = 0;
    first.y = rowY;
    first.w = halfW;
    first.h = rowH;
    second.x = halfW + g;
    second.y = rowY;
    second.w = w - halfW - g;
    second.h = rowH;
  }
  return [hero, first, second];
}

/** Four equal panels in a two-by-two grid. */
function gridPanels(w, h) {
  const g = gutter(w, h);
  const halfW = Math.floor((w - g) / 2);
  const halfH = Math.floor((h - g) / 2);
  return [
    { x: 0, y: 0, w: halfW, h: halfH },
    { x: halfW + g, y: 0, w: w - halfW - g, h: halfH },
    { x: 0, y: halfH + g, w: halfW, h: h - halfH - g },
    { x: halfW + g, y: halfH + g, w: w - halfW - g, h: h - halfH - g },
  ];
}

/** Three equal panels: vertical strips on a wide cover, horizontal bands on a tall one. */
function trioPanels(w, h) {
  const g = gutter(w, h);
  if (w >= h) {
    const third = Math.floor((w - 2 * g) / 3);
    return [
      { x: 0, y: 0, w: third, h },
      { x: third + g, y: 0, w: third, h },
      { x: 2 * (third + g), y: 0, w: w - 2 * (third + g), h },
    ];
  }
  const third = Math.floor((h - 2 * g) / 3);
  return [
    { x: 0, y: 0, w, h: third },
    { x: 0, y: third + g, w, h: third },
    { x: 0, y: 2 * (third + g), w, h: h - 2 * (third + g) },
  ];
}

const BUILDERS = {
  strip: stripPanels,
  grid: gridPanels,
  trio: trioPanels,
};

/**
 * The panel rectangles for `layout` on a cover of `w` by `h` pixels.
 * Unknown layouts fall back to the strip, so a bad query never breaks the render.
 */
export function layoutPanels(layout, w, h) {
  const build = BUILDERS[layout] ?? BUILDERS.strip;
  return build(w, h);
}

/** The band the caption sits in: the bottom fifth of the cover, full width. */
export function captionBand(w, h) {
  const bandH = Math.round(h * 0.22);
  return { x: 0, y: h - bandH, w, h: bandH };
}

/** The panel index under a point on the cover, or -1 when the point is in a gutter. */
export function panelAt(layout, w, h, px, py) {
  const rects = layoutPanels(layout, w, h);
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}
