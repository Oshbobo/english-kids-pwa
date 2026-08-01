# אנגלית לילדים — PWA מקומית ב־HTML5

אפליקציית Single Page Application ללימוד אנגלית לילדים מתחילים. הפרויקט מבוסס HTML5, CSS3 ו־JavaScript Modules בלבד, ללא Backend, ללא חשבון משתמש וללא שירות ענן חיוני.

## מה כלול

- מסלול מלא של 94 יחידות לפי הסדר שנדרש.
- שש היחידות הראשונות עם תוכן הדגמה מלא: 8 מילים, 7 פעילויות, שמע, הקלטה, משחק, ניקוד, כוכבים ושמירת התקדמות.
- 88 היחידות הנוספות עם מבנה JSON אחיד, 8 דוגמאות ו־6 פעילויות לכל יחידה. שדה `contentStatus` מסמן `complete` או `structured`.
- מנוע שיעורים כללי ומנוע פעילויות מבוסס JSON.
- 20 סוגי פעילויות נתמכים, כאשר כמה סוגים משתמשים באותו Renderer נגיש.
- SpeechSynthesis כ־fallback כאשר אין קובץ שמע מקומי.
- MediaRecorder להקלטה זמנית בלבד.
- LocalStorage לפרופיל, התקדמות, מילים, הישגים והגדרות.
- ייצוא וייבוא גיבוי JSON מקומי.
- Manifest, Service Worker, Cache API ומצב Offline.
- ממשק RTL, תוכן אנגלי LTR, מקלדת, Focus, ניגודיות גבוהה, הגדלת טקסט וצמצום אנימציות.

## הרצה מקומית

אין לפתוח את `index.html` ישירות ב־`file://`, משום ש־JavaScript Modules ו־Service Worker דורשים HTTP/HTTPS.

### Python

```bash
cd english-kids-pwa
python3 -m http.server 8080
```

פתחו בדפדפן:

```text
http://localhost:8080
```

### Node

```bash
npx serve .
```

## פריסה לאחסון סטטי

אפשר להעלות את כל תיקיית הפרויקט כפי שהיא ל־GitHub Pages, Netlify, Cloudflare Pages או כל שרת קבצים סטטי. אין שלב Build.

ב־GitHub Pages יש לפרסם את שורש הפרויקט. כל הנתיבים יחסיים ולכן הפרויקט מתאים גם לתת־תיקייה.

## התקנת PWA

- Chrome/Edge/Android: לאחר טעינה מאובטחת ב־HTTPS יופיע כפתור התקנה כאשר הדפדפן מאפשר זאת.
- iPhone/iPad: Share → Add to Home Screen.
- Service Worker אינו פועל ב־`file://`, אך פועל ב־localhost וב־HTTPS.

## הוספת שיעור חדש

1. הוסיפו אובייקט חדש אל `data/lessons.json` לפי המבנה הקיים.
2. שמרו על `id` ייחודי, `order`, `stage`, `words`, `activities`, `completionRules` ו־`rewards`.
3. הוסיפו את מזהה השיעור אל `lessonIds` בשלב המתאים בתוך `data/course.json`.
4. עדכנו `totalLessons` אם נוספה יחידה מעבר ל־94.
5. העלו את גרסת ה־Cache בראש `service-worker.js` כדי שמכשירים יקבלו את התוכן החדש.

## הוספת מילה

הוסיפו אובייקט אל מערך `words` של השיעור:

```json
{
  "id": "lesson-001-word-9",
  "word": "bag",
  "translation": "תיק",
  "image": "assets/images/words/bag.webp",
  "audio": "assets/audio/words/bag.mp3",
  "exampleSentence": "This is my bag.",
  "targetSound": "b",
  "difficulty": 1,
  "topic": "school",
  "specialWord": false
}
```

כדי שהמילה תופיע במילון הכללי, הוסיפו אותה גם ל־`data/words.json`, או הריצו מחדש את סקריפט יצירת הנתונים `build_data.py` לאחר התאמתו.

## הוספת פעילות

הוסיפו אובייקט למערך `activities` בשיעור. דוגמה:

```json
{
  "id": "lesson-001-a8",
  "type": "audio-match",
  "instruction": "הקשיבו ובחרו את המילה",
  "prompt": "bag",
  "audio": "bag",
  "answer": "bag",
  "options": ["bag", "cat", "sun", "pen"],
  "points": 20,
  "maxAttempts": 3,
  "correctFeedback": "מצוין!",
  "retryFeedback": "הקשיבו שוב ונסו תשובה אחרת."
}
```

סוגים נתמכים: `multiple-choice`, `letter-choice`, `image-choice`, `word-heard`, `image-match`, `word-image-match`, `audio-match`, `case-match`, `letter-order`, `word-builder`, `missing-letter`, `missing-pattern`, `sorting-game`, `memory-game`, `true-false`, `listening-game`, `initial-sound`, `final-sound`, `sentence-builder`, `sentence-completion`, `bingo`, `pronunciation-practice`.

להוספת Renderer חדש: צרו מודול ב־`js/activities/` והוסיפו אותו למפה ב־`js/activity-engine.js`.

## החלפת תמונות וקובצי שמע

- תמונות: שמרו WebP/AVIF תחת `assets/images/words/` ועדכנו את שדה `image`.
- שמע: שמרו MP3/OGG תחת `assets/audio/words/` ועדכנו את שדה `audio`.
- כאשר `audio` ריק או נכשל, המערכת משתמשת ב־SpeechSynthesis.
- כאשר תמונה חסרה, מוצג `assets/images/words/placeholder.svg`.
- לאחר שינוי נכסי Offline, עדכנו את `VERSION` ב־`service-worker.js`.

## פרטיות ואבטחה

- אין `eval`, פרסומות, Analytics או סקריפטים חיצוניים.
- אין שליחת נתונים החוצה.
- ייבוא JSON נבדק לפני שמירה.
- הקלטת קול אינה נשמרת ב־LocalStorage או IndexedDB ונמחקת ביציאה מהפעילות.

## בדיקות

```bash
node tests/smoke.mjs
```

הבדיקה מאמתת 94 יחידות, מזהים ייחודיים, 8 מילים לפחות, 5 פעילויות לפחות, שש יחידות מלאות וקיום קובצי הליבה.
