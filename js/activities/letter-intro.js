import { shell, audioButton, el, feedbackNode, setFeedback } from './activity-utils.js';

export function render(activity, ctx) {
  const root = shell(activity);
  const intro = el('p', {
    className: 'activity-help',
    text: 'האות הגדולה והאות הקטנה הן אותה אות. לחצו על הרמקול ושמעו את מילת הדוגמה.'
  });
  const grid = el('div', { className: 'letter-intro-grid' });
  (activity.letters || []).forEach(item => {
    const image = el('img', {
      className: 'letter-example-image',
      src: item.image || 'assets/images/words/placeholder.svg',
      alt: `${item.exampleWord || ''} — ${item.translation || ''}`,
      loading: 'lazy'
    });
    image.addEventListener('error', () => { image.src = 'assets/images/words/placeholder.svg'; });
    const card = el('article', { className: 'letter-intro-card' });
    card.append(
      el('div', { className: 'letter-pair', lang: 'en', dir: 'ltr', text: `${item.upper} ${item.lower}` }),
      el('div', { className: 'letter-sound', text: `הצליל: ${item.soundHe || ''}` }),
      image,
      el('div', { className: 'letter-example-row' }, [
        el('strong', { lang: 'en', dir: 'ltr', text: item.exampleWord || '' }),
        el('span', { text: item.translation || '' }),
        audioButton(item.audio || item.exampleWord || item.upper, '', `השמעת ${item.exampleWord || item.upper}`)
      ])
    );
    grid.append(card);
  });
  const feedback = feedbackNode();
  const done = el('button', {
    className: 'btn btn-primary', type: 'button', text: 'הכרתי את האותיות ✓',
    onclick: () => {
      setFeedback(feedback, 'מצוין! עכשיו נתרגל אותן במשחק.', true);
      done.disabled = true;
      ctx.onComplete?.({ correct: true, points: activity.points || 0 });
    }
  });
  root.append(intro, grid, done, feedback);
  return root;
}
