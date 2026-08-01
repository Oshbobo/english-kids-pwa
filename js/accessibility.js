export function applyAccessibility(settings) {
  const root = document.documentElement;
  root.dataset.textSize = settings.textSize || 'medium';
  root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
  root.dataset.reducedMotion = settings.reducedMotion || !settings.animations ? 'true' : 'false';
}
export function announce(message) {
  let live = document.getElementById('global-live');
  if (!live) { live = document.createElement('div'); live.id = 'global-live'; live.className = 'screen-reader-only'; live.setAttribute('aria-live','polite'); document.body.append(live); }
  live.textContent = ''; requestAnimationFrame(() => { live.textContent = message; });
}
