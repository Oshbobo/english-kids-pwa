import { loadProgress, saveProgress, saveWordMastery, addReviewWord, removeReviewWord } from './storage.js';

export function lessonStatus(lesson, settings = {}) {
  const p = loadProgress();
  if (p.completedLessons.includes(lesson.id)) return 'completed';
  const mastery = lesson.words.map(w => p.wordMastery[w.id]?.status).filter(Boolean);
  if (mastery.includes('review')) return 'review';
  if (settings.unlockAll || lesson.order <= p.currentLesson) return p.lessonActivityIndex[lesson.id] ? 'started' : 'available';
  return 'locked';
}
export function lessonProgressPercent(lesson) {
  const p = loadProgress();
  if (p.completedLessons.includes(lesson.id)) return 100;
  const index = Number(p.lessonActivityIndex[lesson.id] || 0);
  return Math.round((index / Math.max(1, lesson.activities.length)) * 100);
}
export function saveLessonPosition(lessonId, index) {
  const p = loadProgress(); p.lessonActivityIndex[lessonId] = index; return saveProgress(p);
}
export function recordWordResult(wordId, correct, listened = false) {
  const p = loadProgress();
  const old = p.wordMastery[wordId] || { attempts: 0, errors: 0, listens: 0, status: 'new' };
  const next = {
    attempts: old.attempts + 1,
    errors: old.errors + (correct ? 0 : 1),
    listens: old.listens + (listened ? 1 : 0),
    status: correct && old.errors < 2 ? 'learning' : 'review'
  };
  saveWordMastery(wordId, next);
  if (next.errors >= 2 || next.listens >= 4) addReviewWord(wordId);
  else if (next.attempts >= 4 && next.errors <= 1) removeReviewWord(wordId);
  return next;
}
export function markWordForReview(wordId) { return addReviewWord(wordId); }
export function clearWordReview(wordId) { return removeReviewWord(wordId); }
