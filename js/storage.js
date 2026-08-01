const PROGRESS_KEY = 'englishKids.progress.v1';
const PROFILE_KEY = 'englishKids.profile.v1';
const SETTINGS_KEY = 'englishKids.settings.v1';

export const defaultProgress = {
  currentLesson: 1,
  completedLessons: [],
  lessonScores: {},
  lessonStars: {},
  learnedWords: [],
  reviewWords: [],
  wordMastery: {},
  achievements: [],
  stickers: [],
  trophies: [],
  totalPoints: 0,
  streakDays: 0,
  lastActiveDate: null,
  lessonActivityIndex: {}
};

export const defaultProfile = {
  name: '', avatar: '🦊', favoriteColor: '#6c5ce7', created: false
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function safeParse(value, fallback) {
  try { return value ? JSON.parse(value) : clone(fallback); }
  catch { return clone(fallback); }
}
function unique(list) { return [...new Set(list)]; }

export function loadProgress() {
  return { ...clone(defaultProgress), ...safeParse(localStorage.getItem(PROGRESS_KEY), defaultProgress) };
}
export function saveProgress(progress) {
  const normalized = { ...clone(defaultProgress), ...progress };
  normalized.completedLessons = unique(normalized.completedLessons);
  normalized.learnedWords = unique(normalized.learnedWords);
  normalized.reviewWords = unique(normalized.reviewWords);
  normalized.achievements = unique(normalized.achievements);
  normalized.stickers = unique(normalized.stickers);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('progresschange', { detail: normalized }));
  return normalized;
}
export function resetProgress() {
  localStorage.removeItem(PROGRESS_KEY);
  return saveProgress(clone(defaultProgress));
}
export function completeLesson(lessonId, score, stars, wordIds = [], rewards = {}) {
  const p = loadProgress();
  p.completedLessons = unique([...p.completedLessons, lessonId]);
  p.lessonScores[lessonId] = Math.max(Number(p.lessonScores[lessonId] || 0), Number(score || 0));
  p.lessonStars[lessonId] = Math.max(Number(p.lessonStars[lessonId] || 0), Number(stars || 0));
  p.learnedWords = unique([...p.learnedWords, ...wordIds]);
  p.totalPoints += Number(rewards.points || 0);
  if (rewards.sticker) p.stickers = unique([...p.stickers, rewards.sticker]);
  updateStreak(p);
  return saveProgress(p);
}
export function unlockLesson(order) {
  const p = loadProgress();
  p.currentLesson = Math.max(Number(p.currentLesson || 1), Number(order || 1));
  return saveProgress(p);
}
export function saveWordMastery(wordId, patch = {}) {
  const p = loadProgress();
  const current = p.wordMastery[wordId] || { attempts: 0, errors: 0, listens: 0, lastPracticed: null, status: 'new' };
  p.wordMastery[wordId] = { ...current, ...patch, lastPracticed: patch.lastPracticed || new Date().toISOString() };
  return saveProgress(p);
}
export function addReviewWord(wordId) {
  const p = loadProgress(); p.reviewWords = unique([...p.reviewWords, wordId]); return saveProgress(p);
}
export function removeReviewWord(wordId) {
  const p = loadProgress(); p.reviewWords = p.reviewWords.filter(id => id !== wordId); return saveProgress(p);
}
export function awardAchievement(id) {
  const p = loadProgress();
  if (!p.achievements.includes(id)) p.achievements.push(id);
  return saveProgress(p);
}
export function loadSettings(defaults = {}) {
  return { ...defaults, ...safeParse(localStorage.getItem(SETTINGS_KEY), defaults) };
}
export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('settingschange', { detail: settings }));
  return settings;
}
export function loadProfile() {
  return { ...clone(defaultProfile), ...safeParse(localStorage.getItem(PROFILE_KEY), defaultProfile) };
}
export function saveProfile(profile) {
  const normalized = { ...clone(defaultProfile), ...profile };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('profilechange', { detail: normalized }));
  return normalized;
}
export function clearAllLocalData() {
  [PROGRESS_KEY, PROFILE_KEY, SETTINGS_KEY].forEach(key => localStorage.removeItem(key));
}
export function exportProgress() {
  const payload = {
    app: 'english-kids-pwa', version: 1, exportedAt: new Date().toISOString(),
    progress: loadProgress(), profile: loadProfile(), settings: loadSettings({})
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}
export function validateImportPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.app !== 'english-kids-pwa' || payload.version !== 1) return false;
  if (!payload.progress || typeof payload.progress !== 'object') return false;
  const p = payload.progress;
  return Array.isArray(p.completedLessons) && Array.isArray(p.learnedWords) && Number.isFinite(Number(p.totalPoints));
}
export function importProgress(payload) {
  if (!validateImportPayload(payload)) throw new Error('קובץ הגיבוי אינו תקין או אינו שייך לאפליקציה.');
  saveProgress({ ...clone(defaultProgress), ...payload.progress });
  if (payload.profile && typeof payload.profile === 'object') saveProfile(payload.profile);
  if (payload.settings && typeof payload.settings === 'object') saveSettings(payload.settings);
  return true;
}
function updateStreak(progress) {
  const today = new Date().toISOString().slice(0, 10);
  if (!progress.lastActiveDate) progress.streakDays = 1;
  else if (progress.lastActiveDate !== today) {
    const prev = new Date(`${progress.lastActiveDate}T00:00:00`);
    const curr = new Date(`${today}T00:00:00`);
    const diff = Math.round((curr - prev) / 86400000);
    progress.streakDays = diff === 1 ? Number(progress.streakDays || 0) + 1 : 1;
  }
  progress.lastActiveDate = today;
}
