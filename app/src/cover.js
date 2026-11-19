// The cover renderer for Vice Nights: draws a whole poster onto a canvas at any size.
// The same function paints the live preview, the ?shot= scenes and the exported PNGs,
// so what the editor shows is exactly what the export writes. Photos are drawn
// cover-fit into their panel, cropped and positioned by the panel's zoom and pan;
// the grade washes over the whole poster and the caption sits on a scrim at the foot.

import { layoutPanels, captionBand } from './panels.js';
import { applyGrade, captionScrim, gradeFor } from './grade.js';
import { drawCaption } from './lettering.js';

/**
 * Draws `img` into `rect` so the photo covers the panel: scaled to the larger of
 * the two cover ratios, then zoomed and panned. `dx` and `dy` run from -0.5 to 0.5
 * and move the photo by that share of the panel's width and height.
 */
export function drawPhotoInto(ctx, img, rect, zoom, dx, dy) {
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const x = rect.x + (rect.w - dw) / 2 + dx * rect.w;
  const y = rect.y + (rect.h - dh) / 2 + dy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, x, y, dw, dh);
  ctx.restore();
}

/** A panel with no photo yet: a dusk gradient, a drawn sun and a prompt to add one. */
function drawEmptyPanel(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, grade.emptyTop);
  g.addColorStop(1, grade.emptyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // A low sun over a horizon line, drawn from shapes, never an image.
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.42;
  const r = Math.min(rect.w, rect.h) * 0.16;
  ctx.fillStyle = grade.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w * 0.12, cy + r * 1.6);
  ctx.lineTo(rect.x + rect.w * 0.88, cy + r * 1.6);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `700 ${Math.max(11, Math.round(rect.h * 0.05))}px 'Helvetica Neue', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', cx, cy + r * 2.6);
}

/**
 * Draws the poster for `state` onto `canvas` at the canvas's own pixel size.
 * `state` carries photos (images or null, one per slot), the panel settings
 * (which photo, zoom and pan per panel), the layout, the grade and the caption.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeFor(state.grade);
  const rects = layoutPanels(state.layout, w, h);

  // The frame: the grade's dark colour shows through the gutters between panels.
  ctx.fillStyle = grade.dark;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < rects.length; i += 1) {
    const rect = rects[i];
    const panel = state.panels[i] ?? { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const img = state.photos[panel.photo] ?? null;
    if (img) {
      drawPhotoInto(ctx, img, rect, panel.zoom, panel.dx, panel.dy);
    } else {
      drawEmptyPanel(ctx, rect, grade);
    }
    // A crisp white inner edge, the poster's frame around each panel.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.004));
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  }

  applyGrade(ctx, w, h, grade);
  captionScrim(ctx, w, h, grade);
  drawCaption(ctx, captionBand(w, h), state.caption, state.subcaption, grade);
}

/**
 * The editor's selection outline, drawn on top of the preview only (never on an
 * export): a bright accent frame around the selected panel, with its number.
 */
export function drawSelection(ctx, layout, w, h, selected) {
  if (selected < 0) return;
  const rects = layoutPanels(layout, w, h);
  const rect = rects[selected];
  if (!rect) return;
  ctx.save();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(3, Math.round(Math.min(w, h) * 0.008));
  ctx.setLineDash([Math.max(8, w * 0.02), Math.max(6, w * 0.012)]);
  ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  ctx.setLineDash([]);
  const badge = Math.max(20, Math.round(Math.min(w, h) * 0.05));
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(rect.x + badge * 0.7, rect.y + badge * 0.7, badge / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#160a24';
  ctx.font = `900 ${Math.round(badge * 0.55)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(selected + 1), rect.x + badge * 0.7, rect.y + badge * 0.72);
  ctx.restore();
}
