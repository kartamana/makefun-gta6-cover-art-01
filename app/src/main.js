// Vice Nights: wires the editor. A photo in, a caption typed, a layout and a grade
// picked, a PNG out — the whole flow is a few clicks, and the preview is the cover
// itself, drawn live on the canvas. A `?shot=` query instead sets up a fixed scene
// for a screenshot (./shots.js). Photos are read on this machine and never leave it.

import { drawCover, drawSelection } from './cover.js';
import { runShot } from './shots.js';
import { layoutPanels, panelAt, PANEL_COUNTS, LAYOUTS } from './panels.js';
import { GRADES } from './grade.js';

/** The three post sizes the app exports, as width by height in pixels. */
export const EXPORT_SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080' },
};

/** A fresh panel: filled with the first photo, unzoomed, centred. */
function freshPanel(photo = 0) {
  return { photo, zoom: 1, dx: 0, dy: 0 };
}

/** Panels for a layout: as many as the layout holds, each starting on photo 1. */
function freshPanels(layout) {
  const count = PANEL_COUNTS[layout] ?? 3;
  return Array.from({ length: count }, () => freshPanel(0));
}

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subcaptionInput = document.getElementById('subcaption');
const status = document.getElementById('status');
const panelPhoto = document.getElementById('panel-photo');
const panelZoom = document.getElementById('panel-zoom');
const panelDx = document.getElementById('panel-dx');
const panelDy = document.getElementById('panel-dy');

const state = {
  photos: [null, null, null],
  layout: 'strip',
  grade: 'sunset',
  size: '1920x1080',
  caption: 'Sunset Heist',
  subcaption: 'VICE CITY',
  selectedPanel: 0,
  panels: freshPanels('strip'),
};

/** The preview canvas, sized to the chosen export ratio at a handy preview scale. */
function sizePreview() {
  const size = EXPORT_SIZES[state.size] ?? EXPORT_SIZES['1920x1080'];
  const longSide = 960;
  if (size.w >= size.h) {
    canvas.width = longSide;
    canvas.height = Math.round((longSide * size.h) / size.w);
  } else {
    canvas.height = longSide;
    canvas.width = Math.round((longSide * size.w) / size.h);
  }
}

/** Paints the preview: the cover, then the selected panel's outline on top. */
function redraw() {
  drawCover(canvas, state);
  drawSelection(canvas.getContext('2d'), state.layout, canvas.width, canvas.height, state.selectedPanel);
}

/** Shows the selected panel's settings in the panel controls. */
function syncPanelControls() {
  const panel = state.panels[state.selectedPanel] ?? freshPanel();
  panelPhoto.value = String(panel.photo);
  panelZoom.value = String(panel.zoom);
  panelDx.value = String(Math.round(panel.dx * 100));
  panelDy.value = String(Math.round(panel.dy * 100));
}

/** Marks the buttons that match the current layout, grade and size as active. */
function syncButtons() {
  for (const button of document.querySelectorAll('#layouts [data-layout]')) {
    button.classList.toggle('active', button.dataset.layout === state.layout);
  }
  for (const button of document.querySelectorAll('#grades [data-grade]')) {
    button.classList.toggle('active', button.dataset.grade === state.grade);
  }
  for (const button of document.querySelectorAll('#sizes [data-size]')) {
    button.classList.toggle('active', button.dataset.size === state.size);
  }
}

/** Loads an image from a URL, resolving once it can be drawn on a canvas. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Puts an image into a photo slot and repaints. */
async function setPhoto(slot, img) {
  state.photos[slot] = img;
  redraw();
}

/** The first photo slot without a photo yet, or slot 0 when all are taken. */
function nextFreeSlot() {
  const free = state.photos.findIndex((p) => p === null);
  return free === -1 ? 0 : free;
}

// --- Photo uploads ---------------------------------------------------------
for (let slot = 0; slot < 3; slot += 1) {
  document.getElementById(`photo${slot}`).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImage(URL.createObjectURL(file));
      await setPhoto(slot, img);
      status.textContent = `Photo ${slot + 1} loaded — ${file.name}`;
    } catch {
      status.textContent = `Photo ${slot + 1} could not be read.`;
    }
  });
}

document.getElementById('sample-pier').addEventListener('click', async () => {
  const slot = nextFreeSlot();
  await setPhoto(slot, await loadImage('samples/pier.jpg'));
  status.textContent = `Sample photo "Pier" loaded into photo ${slot + 1}.`;
});
document.getElementById('sample-boulevard').addEventListener('click', async () => {
  const slot = nextFreeSlot();
  await setPhoto(slot, await loadImage('samples/boulevard.jpg'));
  status.textContent = `Sample photo "Boulevard" loaded into photo ${slot + 1}.`;
});

// --- Layout, grade and size -------------------------------------------------
function wireButtonGroup(elementId, attr, apply) {
  document.getElementById(elementId).addEventListener('click', (e) => {
    const button = e.target.closest(`[data-${attr}]`);
    if (!button) return;
    for (const other of document.querySelectorAll(`#${elementId} [data-${attr}]`)) {
      other.classList.toggle('active', other === button);
    }
    apply(button.dataset[attr]);
    redraw();
  });
}

wireButtonGroup('layouts', 'layout', (layout) => {
  const old = state.panels;
  state.layout = layout;
  state.panels = freshPanels(layout);
  // Keep each panel's photo where it was, when the new layout has that panel.
  for (let i = 0; i < Math.min(old.length, state.panels.length); i += 1) {
    state.panels[i].photo = old[i].photo;
  }
  state.selectedPanel = 0;
  syncPanelControls();
});

wireButtonGroup('grades', 'grade', (grade) => {
  state.grade = grade;
});

document.getElementById('sizes').addEventListener('click', (e) => {
  const button = e.target.closest('[data-size]');
  if (!button) return;
  for (const other of document.querySelectorAll('#sizes [data-size]')) {
    other.classList.toggle('active', other === button);
  }
  state.size = button.dataset.size;
  sizePreview();
  redraw();
});

// --- Caption ------------------------------------------------------------------
captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});
subcaptionInput.addEventListener('input', () => {
  state.subcaption = subcaptionInput.value;
  redraw();
});

// --- Selected panel -----------------------------------------------------------
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const hit = panelAt(state.layout, canvas.width, canvas.height, px, py);
  if (hit >= 0) {
    state.selectedPanel = hit;
    syncPanelControls();
    redraw();
  }
});

panelPhoto.addEventListener('change', () => {
  state.panels[state.selectedPanel].photo = Number(panelPhoto.value);
  redraw();
});
panelZoom.addEventListener('input', () => {
  state.panels[state.selectedPanel].zoom = Number(panelZoom.value);
  redraw();
});
panelDx.addEventListener('input', () => {
  state.panels[state.selectedPanel].dx = Number(panelDx.value) / 100;
  redraw();
});
panelDy.addEventListener('input', () => {
  state.panels[state.selectedPanel].dy = Number(panelDy.value) / 100;
  redraw();
});

// --- Export -------------------------------------------------------------------
/** Renders the cover at an export size and downloads it as a PNG. */
export function exportCover(sizeName) {
  const size = EXPORT_SIZES[sizeName];
  if (!size) return;
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — the browser could not make the PNG.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-nights-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved vice-nights-${size.w}x${size.h}.png`;
  }, 'image/png');
}

document.getElementById('exports').addEventListener('click', (e) => {
  const button = e.target.closest('[data-export]');
  if (!button) return;
  exportCover(button.dataset.export);
});

// --- Shots ----------------------------------------------------------------------
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, {
    async setup(scene) {
      state.layout = scene.layout in LAYOUTS ? scene.layout : 'strip';
      state.grade = scene.grade in GRADES ? scene.grade : 'sunset';
      state.size = scene.size in EXPORT_SIZES ? scene.size : '1920x1080';
      state.caption = scene.caption;
      state.subcaption = scene.subcaption;
      state.panels = freshPanels(state.layout);
      state.photos[0] = await loadImage(`samples/${scene.photo}.jpg`);
      if (scene.photo2) {
        state.photos[1] = await loadImage(`samples/${scene.photo2}.jpg`);
        // The second panel shows the second photo, the rest the first.
        if (state.panels[1]) state.panels[1].photo = 1;
      }
      captionInput.value = scene.caption;
      subcaptionInput.value = scene.subcaption;
      syncButtons();
      syncPanelControls();
      if (shot === 'cover') {
        // The cover fills the viewport at the screenshot's own aspect.
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      } else {
        sizePreview();
      }
      state.selectedPanel = -1;
      redraw();
    },
  });
} else {
  sizePreview();
  syncPanelControls();
  redraw();
}
