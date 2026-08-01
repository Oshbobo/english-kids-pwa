const cache = new Map();
async function getJson(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`לא ניתן לטעון את ${path}`);
  const data = await response.json(); cache.set(path, data); return data;
}
export const loadCourse = () => getJson('data/course.json');
export const loadLessons = () => getJson('data/lessons.json');
export const loadWords = () => getJson('data/words.json');
export const loadSentences = () => getJson('data/sentences.json');
export const loadRewards = () => getJson('data/rewards.json');
export const loadDefaultSettings = () => getJson('data/settings.json');
export async function loadLesson(id) {
  const lessons = await loadLessons();
  return lessons.find(lesson => lesson.id === id) || null;
}
export async function getWordsByIds(ids = []) {
  const words = await loadWords(); const wanted = new Set(ids); return words.filter(w => wanted.has(w.id));
}
