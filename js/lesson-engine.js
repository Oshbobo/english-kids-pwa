import { renderActivity, cleanupActivity } from './activity-engine.js';
import { el, audioButton } from './activities/activity-utils.js';
import { loadProgress, completeLesson, unlockLesson } from './storage.js';
import { saveLessonPosition, recordWordResult } from './progress.js';
import { starsForScore, evaluateAchievements } from './rewards.js';
import { navigate } from './router.js';

let activeCleanup = null;
export function cleanupLesson() { cleanupActivity(); activeCleanup?.(); activeCleanup = null; }

export function renderLesson(lesson, host) {
  cleanupLesson();
  let index = Number(loadProgress().lessonActivityIndex[lesson.id] || 0);
  if (index >= lesson.activities.length) index = 0;
  let scorePoints = 0, currentComplete = false, started = false;

  const page = el('div', { className: 'page lesson-page' });
  const toolbar = el('div', { className: 'lesson-toolbar' });
  const homeBtn = el('button', { className: 'btn btn-ghost', type: 'button', text: '🏠 בית', onclick: () => navigate('home') });
  const backBtn = el('button', { className: 'btn btn-ghost', type: 'button', text: '↩️ חזרה', onclick: () => { if (started && index > 0) { index--; showActivity(); } else navigate('path'); } });
  const progressLabel = el('span', { className: 'pill', text: `פעילות 1 מתוך ${lesson.activities.length}` });
  const exitBtn = el('button', { className: 'btn btn-ghost', type: 'button', text: 'יציאה', onclick: () => navigate('path') });
  toolbar.append(homeBtn, backBtn, progressLabel, exitBtn);

  const progressTrack = el('div', { className: 'progress-track', role: 'progressbar', 'aria-label': 'התקדמות בשיעור', 'aria-valuemin': '0', 'aria-valuemax': '100' });
  const progressFill = el('div', { className: 'progress-fill' }); progressTrack.append(progressFill);
  const layout = el('div', { className: 'lesson-layout' });
  const activityHost = el('section', { className: 'activity-area' });
  const sidebar = el('aside', { className: 'lesson-sidebar' });
  const mascot = el('div', { className: 'card mascot' }, [el('div', { className: 'mascot-face', text: '🦊' }), el('div', { className: 'mascot-bubble', text: 'אני כאן איתכם. אפשר להקשיב שוב ולנסות בקצב שלכם!' })]);
  const wordBox = el('div', { className: 'card' });
  wordBox.append(el('h3', { text: 'מילות השיעור' }));
  const wordChips = el('div', { className: 'stat-row' });
  lesson.words.slice(0, 8).forEach(word => {
    const b = el('button', { className: 'badge', type: 'button', lang: 'en', dir: 'ltr', text: `🔊 ${word.word}`, onclick: () => audioButton(word.word).click() });
    wordChips.append(b);
  }); wordBox.append(wordChips); sidebar.append(mascot, wordBox);
  layout.append(activityHost, sidebar);
  const controls = el('div', { className: 'button-row' });
  const repeatBtn = el('button', { className: 'btn btn-secondary', type: 'button', text: '🔊 השמעה חוזרת' });
  const nextBtn = el('button', { className: 'btn btn-primary', type: 'button', text: 'הבא ➜', disabled: 'true' });
  controls.append(repeatBtn, nextBtn);
  page.append(toolbar, progressTrack, layout, controls); host.replaceChildren(page);

  const intro = () => {
    started = false; currentComplete = true; nextBtn.disabled = false; nextBtn.textContent = 'מתחילים 🚀'; progressLabel.textContent = 'פתיחת שיעור'; progressFill.style.width = '0%';
    const card = el('section', { className: 'card activity-card confetti' });
    card.append(el('div', { className: 'activity-prompt', text: lesson.icon }), el('h1', { className: 'activity-instruction', text: lesson.titleHe }), el('p', { className: 'page-subtitle', text: lesson.learningGoal }), el('div', { className: 'mascot' }, [el('div', { className: 'mascot-face', text: '🦊' }), el('div', { className: 'mascot-bubble', text: lesson.childInstruction })]));
    activityHost.replaceChildren(card); repeatBtn.onclick = () => {};
  };

  const showActivity = () => {
    started = true; currentComplete = false; nextBtn.disabled = true; nextBtn.textContent = index === lesson.activities.length - 1 ? 'סיום השיעור ⭐' : 'הבא ➜';
    const activity = lesson.activities[index];
    progressLabel.textContent = `פעילות ${index + 1} מתוך ${lesson.activities.length}`;
    const percent = Math.round((index / lesson.activities.length) * 100); progressFill.style.width = `${percent}%`; progressTrack.setAttribute('aria-valuenow', String(percent));
    repeatBtn.onclick = () => {
      const text = activity.audio || activity.prompt || lesson.words[0]?.word;
      if (text) audioButton(text).click();
    };
    const node = renderActivity(activity, {
      lesson,
      onAttempt(correct) {
        const found = lesson.words.find(w => String(w.word).toLowerCase() === String(activity.prompt || activity.audio || '').toLowerCase());
        if (found) recordWordResult(found.id, correct, activity.type.includes('audio'));
      },
      onComplete(result = {}) {
        if (!currentComplete) scorePoints += Number(result.points || 0);
        currentComplete = true; nextBtn.disabled = false;
      }
    });
    activityHost.replaceChildren(node); saveLessonPosition(lesson.id, index);
  };

  const finish = () => {
    cleanupActivity();
    const possible = lesson.activities.reduce((sum, a) => sum + Number(a.points || 0), 0) || 1;
    const score = Math.max(60, Math.min(100, Math.round((scorePoints / possible) * 100)));
    const stars = starsForScore(score);
    completeLesson(lesson.id, score, stars, lesson.words.map(w => w.id), { points: lesson.rewards.points, sticker: lesson.rewards.sticker });
    unlockLesson(Math.min(94, lesson.order + 1)); saveLessonPosition(lesson.id, 0); const newAchievements = evaluateAchievements();
    progressFill.style.width = '100%'; progressTrack.setAttribute('aria-valuenow', '100'); progressLabel.textContent = 'השיעור הושלם'; controls.hidden = true;
    const complete = el('section', { className: 'card lesson-complete confetti' });
    complete.append(el('div', { className: 'celebration', text: '🎉' }), el('h1', { text: 'כל הכבוד! סיימתם את השיעור' }), el('div', { className: 'stars', 'aria-label': `${stars} כוכבים`, text: '⭐'.repeat(stars) + '☆'.repeat(3 - stars) }), el('p', { text: `צברתם ${lesson.rewards.points} נקודות וקיבלתם מדבקה חדשה.` }));
    if (newAchievements.length) complete.append(el('p', { className: 'badge badge-success', text: 'נפתח הישג חדש! 🏆' }));
    complete.append(el('div', { className: 'button-row' }, [
      el('button', { className: 'btn btn-primary', type: 'button', text: lesson.order < 94 ? 'ליחידה הבאה' : 'למסלול', onclick: () => navigate(lesson.order < 94 ? `lesson/lesson-${String(lesson.order + 1).padStart(3, '0')}` : 'path') }),
      el('button', { className: 'btn btn-secondary', type: 'button', text: 'לתרגל שוב', onclick: () => { index = 0; scorePoints = 0; controls.hidden = false; showActivity(); } }),
      el('button', { className: 'btn btn-ghost', type: 'button', text: 'חזרה למסלול', onclick: () => navigate('path') })
    ]));
    activityHost.replaceChildren(complete);
  };

  nextBtn.addEventListener('click', () => {
    if (!started) { showActivity(); return; }
    if (!currentComplete) return;
    if (index < lesson.activities.length - 1) { index++; showActivity(); } else finish();
  });

  intro();
  activeCleanup = () => cleanupActivity();
}
