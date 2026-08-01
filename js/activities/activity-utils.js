import { playAudio } from '../audio.js';
import { announce } from '../accessibility.js';

export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  });
  (Array.isArray(children) ? children : [children]).filter(Boolean).forEach(child => node.append(child));
  return node;
}
export function shell(activity) {
  const root = el('section', { className: 'activity-card card', 'aria-labelledby': `${activity.id}-title` });
  root.append(el('h2', { id: `${activity.id}-title`, className: 'activity-instruction', text: activity.instruction || 'בצעו את הפעילות' }));
  return root;
}
export function promptNode(text) { return el('div', { className: 'activity-prompt', lang: 'en', dir: 'ltr', text }); }
export function feedbackNode() { return el('div', { className: 'feedback', role: 'status', 'aria-live': 'polite', text: 'אפשר להתחיל 😊' }); }
export function setFeedback(node, text, success = false) { node.textContent = text; node.classList.toggle('success', success); announce(text); }
export function audioButton(text, src = '', label = 'השמעת המילה', slow = false) {
  return el('button', { className: 'audio-play', type: 'button', 'aria-label': label, text: slow ? '🐢' : '🔊', onclick: async () => {
    try { await playAudio({ src, text, slow }); } catch (error) { announce(error.message); }
  }});
}
export function makeChoices(activity, ctx, answer = activity.answer) {
  const feedback = feedbackNode(); const grid = el('div', { className: 'choice-grid' }); let locked = false;
  (activity.options || []).forEach(option => {
    const button = el('button', { className: 'choice-button', type: 'button', lang: 'en', dir: 'ltr', text: option });
    button.addEventListener('click', () => {
      if (locked) return;
      ctx.onAttempt?.(option === answer, activity);
      if (String(option) === String(answer)) {
        locked = true; button.classList.add('correct'); setFeedback(feedback, activity.correctFeedback || 'כל הכבוד!', true); ctx.onComplete?.({ correct: true, points: activity.points || 0 });
      } else {
        button.classList.remove('retry'); requestAnimationFrame(() => button.classList.add('retry'));
        setFeedback(feedback, activity.retryFeedback || 'כמעט! נסו שוב.');
      }
    }); grid.append(button);
  });
  return { grid, feedback };
}
export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
