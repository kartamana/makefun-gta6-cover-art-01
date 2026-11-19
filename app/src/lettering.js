// Bold caption lettering for Vice Nights: the big poster title and its tag line.
// Everything is drawn with the system sans-serif stack, so the app needs no font file
// and the lettering looks the same on every machine. The title is white with a dark
// outline and a coloured glow, sized to fit the cover whatever the words say.

/** The font stack for poster type: heavy, condensed-feeling, no download needed. */
function titleFont(size) {
  return `900 ${size}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
}

function tagFont(size) {
  return `700 ${size}px 'Helvetica Neue', Arial, sans-serif`;
}

/**
 * Splits `text` into at most two lines that each fit `maxWidth` at `size`.
 * Words are kept whole; a single word longer than the line is cut to fit.
 */
function wrapLines(ctx, text, size, maxWidth) {
  ctx.font = titleFont(size);
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
    if (lines.length === 2) break;
  }
  if (line && lines.length < 2) lines.push(line);
  // A third line would not fit the band: fold the rest onto the second line, cut short.
  if (lines.length === 2 && words.length > 0) {
    const used = lines.join(' ').split(/\s+/).length;
    if (used < words.length) {
      let second = lines[1];
      while (second.length > 0 && ctx.measureText(`${second}…`).width > maxWidth) {
        second = second.slice(0, -1);
      }
      lines[1] = `${second}…`;
    }
  }
  return lines;
}

/**
 * The largest title size, in pixels, at which `text` fits `maxWidth` on at most
 * two lines and within `maxHeight` of vertical room, starting from `startSize`
 * and shrinking in steps. Both the width and the height bind: a long title that
 * wraps to two lines must still fit the band, so a tall cover with a wide title
 * gets smaller letters rather than a second line that runs off the bottom.
 */
function fitSize(ctx, text, startSize, maxWidth, maxHeight) {
  let size = Math.min(startSize, Math.floor(maxHeight / 1.02));
  while (size > 10) {
    const lines = wrapLines(ctx, text, size, maxWidth);
    const widest = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
    const totalH = lines.length * size * 1.02;
    if (widest <= maxWidth && lines.length <= 2 && totalH <= maxHeight) return size;
    size -= 2;
  }
  return size;
}

/**
 * Draws the caption in the band at the bottom of the cover: the tag line small and
 * letterspaced in the grade's accent colour, then the title big, white, outlined and
 * glowing. `band` is the caption band rectangle; the text is centred in it, and the
 * title is sized so that even a two-line title with its tag line fits the band.
 */
export function drawCaption(ctx, band, caption, subcaption, grade) {
  const text = (caption || '').trim().toUpperCase();
  const tag = (subcaption || '').trim().toUpperCase();
  if (!text && !tag) return;

  const maxWidth = band.w * 0.88;
  const cx = band.x + band.w / 2;

  // The tag line takes the top of the band; the title gets the rest.
  const tagSize = tag ? Math.max(10, Math.round(band.h * 0.13)) : 0;
  const topPad = tag
    ? Math.round(band.h * 0.10) + Math.round(tagSize * 1.5)
    : Math.round(band.h * 0.18);
  const bottomPad = Math.round(band.h * 0.06);
  const titleAreaH = Math.max(20, band.h - topPad - bottomPad);

  if (tag) {
    ctx.font = tagFont(tagSize);
    try {
      ctx.letterSpacing = `${Math.round(tagSize * 0.35)}px`;
    } catch {
      // letterSpacing is new in some browsers; spacing is a nicety, not a need.
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = tagSize * 0.4;
    ctx.fillText(tag, cx, band.y + Math.round(band.h * 0.10) + tagSize);
    ctx.shadowBlur = 0;
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // See above.
    }
  }

  if (!text) return;
  const size = fitSize(ctx, text, Math.round(band.h * 0.52), maxWidth, titleAreaH);
  const lines = wrapLines(ctx, text, size, maxWidth);
  const lineHeight = size * 1.02;
  const totalH = lines.length * lineHeight;
  let y = band.y + topPad + (titleAreaH - totalH) / 2 + size * 0.82;
  ctx.font = titleFont(size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 4, 20, 0.9)';
  ctx.lineWidth = Math.max(2, Math.round(size / 14));
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = Math.round(size * 0.28);
  ctx.fillStyle = '#ffffff';
  for (const line of lines) {
    ctx.strokeText(line, cx, y);
    ctx.fillText(line, cx, y);
    y += lineHeight;
  }
  ctx.shadowBlur = 0;
}
