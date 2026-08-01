import { shell, audioButton, el, feedbackNode, setFeedback } from './activity-utils.js';

export function render(activity, ctx) {
  const root = shell(activity);
  const grid = el('div', { className: 'word-gallery' });
  (activity.words || []).forEach(word => {
    const image = el('img', {
      className: 'gallery-word-image', src: word.image || 'assets/images/words/placeholder.svg',
      alt: `${word.word} — ${word.translation}`, loading: 'lazy'
    });
    image.addEventListener('error', () => { image.src = 'assets/images/words/placeholder.svg'; });
    const card = el('article', { className: 'gallery-word-card' }, [
      image,
      el('div', { className: 'gallery-word-copy' }, [
        el('strong', { className: 'gallery-word-en', lang: 'en', dir: 'ltr', text: word.word }),
        el('span', { text: word.translation }),
        audioButton(word.word, word.audio || '', `השמעת המילה ${word.word}`)
      ])
    ]);
    grid.append(card);
  });
  const feedback = feedbackNode();
  const done = el('button', {
    className: 'btn btn-primary', type: 'button', text: 'הקשבתי למילים ✓',
    onclick: () => {
      setFeedback(feedback, 'איזה יופי! ממשיכים לתרגול.', true);
      done.disabled = true;
      ctx.onComplete?.({ correct: true, points: activity.points || 0 });
    }
  });
  root.append(grid, done, feedback);
  return root;
}
