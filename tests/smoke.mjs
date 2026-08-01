import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = name => JSON.parse(fs.readFileSync(path.join(root,'data',name),'utf8'));
const course = read('course.json'), lessons = read('lessons.json');
assert.equal(course.totalLessons,94,'course totalLessons');
assert.equal(lessons.length,94,'lessons length');
assert.equal(new Set(lessons.map(l=>l.id)).size,94,'unique lesson ids');
assert.deepEqual(lessons.map(l=>l.order),Array.from({length:94},(_,i)=>i+1),'continuous order');
for(const lesson of lessons){assert.ok(lesson.words.length>=8,`${lesson.id} words`);assert.ok(lesson.activities.length>=5,`${lesson.id} activities`);assert.ok(lesson.completionRules?.minimumScore>=0,`${lesson.id} completion`);}
assert.ok(lessons.slice(0,6).every(l=>l.contentStatus==='complete'&&l.activities.length>=7),'first six complete');
const required=['index.html','manifest.webmanifest','service-worker.js','offline.html','js/app.js','js/lesson-engine.js','js/activity-engine.js','css/layout.css','README.md'];
required.forEach(file=>assert.ok(fs.existsSync(path.join(root,file)),`missing ${file}`));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));assert.equal(manifest.display,'standalone');assert.ok(manifest.icons.length>=3);
console.log(`PASS: ${lessons.length} lessons, ${lessons.reduce((n,l)=>n+l.words.length,0)} word entries, ${lessons.reduce((n,l)=>n+l.activities.length,0)} activities.`);
