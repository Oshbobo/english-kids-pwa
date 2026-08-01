import { shell, audioButton, el, feedbackNode, setFeedback } from './activity-utils.js';

let resizeHandler = null;

export function render(activity, ctx) {
  const root = shell(activity);
  const letter = activity.letter || 'A';
  const lower = activity.lower || letter.toLowerCase();
  root.append(el('p', { className: 'activity-help', text: 'ציירו עם האצבע או העכבר מעל האות. אין ציון על הכתיבה — רק מתרגלים.' }));
  root.append(el('div', { className: 'trace-letter-label', lang: 'en', dir: 'ltr', text: `${letter} ${lower}` }));
  root.append(el('div', { className: 'audio-control' }, [audioButton(activity.audio || letter, '', `השמעת האות ${letter}`)]));

  const wrap = el('div', { className: 'trace-canvas-wrap' });
  const canvas = el('canvas', { className: 'trace-canvas', 'aria-label': `משטח תרגול כתיבת האות ${letter}` });
  wrap.append(canvas); root.append(wrap);
  const ctx2d = canvas.getContext('2d');
  let drawing = false;

  function sizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.max(320, Math.floor(rect.width * ratio));
    canvas.height = Math.floor(300 * ratio);
    canvas.style.height = '300px';
    ctx2d.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawGuide();
  }
  function drawGuide() {
    const w = canvas.clientWidth || 600;
    ctx2d.clearRect(0, 0, w, 300);
    ctx2d.save(); ctx2d.globalAlpha = .14; ctx2d.fillStyle = '#6c5ce7';
    ctx2d.textAlign = 'center'; ctx2d.textBaseline = 'middle'; ctx2d.font = '900 230px Arial, sans-serif';
    ctx2d.fillText(letter, w / 2, 150); ctx2d.restore();
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  canvas.addEventListener('pointerdown', event => {
    drawing = true; canvas.setPointerCapture?.(event.pointerId);
    const p = point(event); ctx2d.beginPath(); ctx2d.moveTo(p.x, p.y);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drawing) return; const p = point(event);
    ctx2d.lineWidth = 14; ctx2d.lineCap = 'round'; ctx2d.lineJoin = 'round'; ctx2d.strokeStyle = '#253047';
    ctx2d.lineTo(p.x, p.y); ctx2d.stroke();
  });
  const stop = () => { drawing = false; };
  canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop); canvas.addEventListener('pointerleave', stop);
  resizeHandler = () => sizeCanvas(); window.addEventListener('resize', resizeHandler); requestAnimationFrame(sizeCanvas);

  const feedback = feedbackNode();
  const clear = el('button', { className: 'btn btn-ghost', type: 'button', text: 'ניקוי ותרגול מחדש', onclick: drawGuide });
  const done = el('button', { className: 'btn btn-primary', type: 'button', text: 'סיימתי לתרגל ✓', onclick: () => {
    setFeedback(feedback, 'עבודה נהדרת! תרגול הכתיבה הושלם.', true); done.disabled = true;
    ctx.onComplete?.({ correct: true, points: activity.points || 0 });
  }});
  root.append(el('div', { className: 'button-row' }, [clear, done]), feedback);
  return root;
}

export function cleanup() {
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  resizeHandler = null;
}
