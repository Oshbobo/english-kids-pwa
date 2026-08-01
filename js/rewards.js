import { loadProgress, awardAchievement } from './storage.js';
export function evaluateAchievements() {
  const p = loadProgress(); const earned = [];
  const checks = [
    ['first-lesson', p.completedLessons.length >= 1],
    ['beginner-reader', p.completedLessons.length >= 6],
    ['letter-expert', p.completedLessons.length >= 10],
    ['sound-champion', Object.values(p.lessonStars).reduce((a,b)=>a+Number(b||0),0) >= 20],
    ['ten-words', p.learnedWords.length >= 10],
    ['three-streak', p.streakDays >= 3],
    ['week-streak', p.streakDays >= 7]
  ];
  checks.forEach(([id, ok]) => { if (ok && !p.achievements.includes(id)) { awardAchievement(id); earned.push(id); } });
  return earned;
}
export function starsForScore(score) { return score >= 90 ? 3 : score >= 75 ? 2 : score >= 60 ? 1 : 0; }
