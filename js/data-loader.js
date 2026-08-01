import { starterLessons } from './starter-content.js';

const cache = new Map();
async function getJson(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`לא ניתן לטעון את ${path}`);
  const data = await response.json(); cache.set(path, data); return data;
}
let mergedLessonsPromise = null;
let mergedWordsPromise = null;
export const loadCourse = () => getJson('data/course.json');
export const loadSentences = () => getJson('data/sentences.json');
export const loadRewards = () => getJson('data/rewards.json');
export const loadDefaultSettings = () => getJson('data/settings.json');
export function loadLessons() {
  if (!mergedLessonsPromise) mergedLessonsPromise = getJson('data/lessons.json').then(base => {
    const overrides = new Map(starterLessons.map(lesson => [lesson.id, lesson]));
    return base.map(lesson => overrides.get(lesson.id) || lesson);
  });
  return mergedLessonsPromise;
}
export function loadWords() {
  if (!mergedWordsPromise) mergedWordsPromise = Promise.all([getJson('data/words.json'), loadLessons()]).then(([base, lessons]) => {
    const starterWords = lessons.slice(0, 6).flatMap(lesson => lesson.words || []);
    const ids = new Set(starterWords.map(word => word.id));
    return [...starterWords, ...base.filter(word => !ids.has(word.id))];
  });
  return mergedWordsPromise;
}
export async function loadLesson(id) { const lessons = await loadLessons(); return lessons.find(lesson => lesson.id === id) || null; }
export async function getWordsByIds(ids = []) { const words = await loadWords(); const wanted = new Set(ids); return words.filter(word => wanted.has(word.id)); }
