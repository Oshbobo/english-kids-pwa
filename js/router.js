const listeners = new Set();
export function currentRoute() { return location.hash.replace(/^#\/?/, '') || 'home'; }
export function navigate(path) { location.hash = `#/${String(path).replace(/^\//,'')}`; }
export function onRouteChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function notify() { listeners.forEach(fn => fn(currentRoute())); }
export function startRouter() { addEventListener('hashchange', notify); notify(); }
export function parseRoute(route) { const [path, ...parts] = route.split('/'); return { path, parts }; }
