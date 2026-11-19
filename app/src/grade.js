// Colour grades for Vice Nights: the Vice City sunset and neon looks.
// A grade is a set of colours, never an image: the renderer draws them as gradients
// over the photos, so every cover keeps the same grade no matter which photo fills it.

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    // Warm orange at the top fading to hot pink at the bottom.
    washTop: 'rgba(255, 154, 61, 0.28)',
    washBottom: 'rgba(255, 94, 122, 0.34)',
    // The dark colour the caption scrim fades into.
    dark: '#160a24',
    // The glow around the caption and the accent of the tag line.
    accent: '#ffd166',
    // The tint of a panel that has no photo yet.
    emptyTop: '#3d1e5c',
    emptyBottom: '#12081f',
  },
  neon: {
    label: 'Neon Nights',
    // Magenta from the top, cyan from the bottom, the Miami night look.
    washTop: 'rgba(255, 45, 149, 0.30)',
    washBottom: 'rgba(34, 211, 238, 0.30)',
    dark: '#0a0618',
    accent: '#22d3ee',
    emptyTop: '#2a0f4d',
    emptyBottom: '#05030f',
  },
  noir: {
    label: 'Palm Noir',
    // A quiet purple dusk with a single warm edge, for a moodier cover.
    washTop: 'rgba(124, 58, 237, 0.26)',
    washBottom: 'rgba(255, 122, 26, 0.22)',
    dark: '#0d0817',
    accent: '#f0abfc',
    emptyTop: '#241640',
    emptyBottom: '#070410',
  },
};

/** The grade for a name, falling back to the sunset grade on a bad name. */
export function gradeFor(name) {
  return GRADES[name] ?? GRADES.sunset;
}

/**
 * Washes the whole cover in the grade: a warm-to-pink (or magenta-to-cyan) gradient
 * over the photos, then a vignette that darkens the corners so the caption reads.
 */
export function applyGrade(ctx, w, h, grade) {
  const wash = ctx.createLinearGradient(0, 0, w * 0.4, h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/**
 * The scrim the caption sits on: transparent where the art shows, fading to the
 * grade's dark colour at the very bottom so white lettering always reads.
 */
export function captionScrim(ctx, w, h, grade) {
  const bandTop = h * 0.52;
  const scrim = ctx.createLinearGradient(0, bandTop, 0, h);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(0.55, hexWithAlpha(grade.dark, 0.55));
  scrim.addColorStop(1, hexWithAlpha(grade.dark, 0.92));
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandTop, w, h - bandTop);
}

/** Turns a #rrggbb colour into an rgba() string at the given opacity. */
export function hexWithAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
