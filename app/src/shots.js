// Fixed scenes for screenshots: a ?shot= query sets up a reproducible render of the
// app's own code, so a screenshot is a real render and never a composite.
//   ?shot=cover  the cover alone, filling the viewport (the controls are hidden)
//   ?shot=editor the editor with a sample photo loaded
// `photo` picks the first sample (samples/<photo>.jpg), `photo2` an optional second
// sample for another panel, `caption` the words, `layout`, `grade` and `size` the
// cover's shape. window.__shotReady is set once the scene has painted.

/**
 * Runs a shot scene. `api` is the editor's small surface: setup loads the samples
 * and applies the scene, ready fires once the paint has happened.
 */
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const scene = {
    photo: query.get('photo') ?? 'pier',
    photo2: query.get('photo2') ?? null,
    caption: query.get('caption') ?? 'Sunset Heist',
    subcaption: query.get('subcaption') ?? 'VICE CITY',
    layout: query.get('layout') ?? 'strip',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? '1920x1080',
  };
  await api.setup(scene);
  // Two frames: one for the state to apply, one for the canvas to paint.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
