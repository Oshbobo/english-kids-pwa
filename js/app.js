import { startRouter, onRouteChange, parseRoute, navigate } from './router.js';
import { loadCourse, loadLessons, loadWords, loadSentences, loadRewards, loadDefaultSettings, loadLesson } from './data-loader.js';
import { loadProgress, loadProfile, saveProfile, loadSettings, saveSettings, resetProgress, clearAllLocalData, exportProgress, importProgress } from './storage.js';
import { lessonStatus, lessonProgressPercent, markWordForReview } from './progress.js';
import { applyAccessibility } from './accessibility.js';
import { renderLesson, cleanupLesson } from './lesson-engine.js';
import { playAudio } from './audio.js';
import { renderActivity, cleanupActivity } from './activity-engine.js';
import { el } from './activities/activity-utils.js';

const main = document.getElementById('app-main');
const offlineBanner = document.getElementById('offline-banner');
const pointsPill = document.getElementById('points-pill');
const installButton = document.getElementById('install-button');
const dialog = document.getElementById('app-dialog');
let deferredInstallPrompt = null;
let defaults = {}, settings = {}, lessons = [], course = null, words = [], sentences = [], rewards = null;

function page(title, subtitle = '') {
  const root = el('div', { className: 'page' });
  const header = el('header', { className: 'page-header' });
  const copy = el('div'); copy.append(el('h1', { className: 'page-title', text: title }));
  if (subtitle) copy.append(el('p', { className: 'page-subtitle', text: subtitle }));
  header.append(copy); root.append(header); return root;
}
function button(text, route, style = 'btn-primary') { return el('button', { className: `btn ${style}`, type: 'button', text, onclick: () => navigate(route) }); }
function sectionTitle(text) { return el('h2', { className: 'section-title', text }); }
function showToast(message) { const toast = document.getElementById('toast'); toast.textContent = message; toast.hidden = false; clearTimeout(showToast.timer); showToast.timer = setTimeout(() => { toast.hidden = true; }, 2600); }
function updateChrome(route = '') {
  const p = loadProgress(); pointsPill.textContent = `⭐ ${p.totalPoints}`;
  const section = route.split('/')[0];
  document.querySelectorAll('[data-nav]').forEach(link => link.toggleAttribute('aria-current', link.dataset.nav === section || (section === 'units' && link.dataset.nav === 'path')));
}
function statusLabel(status) {
  return ({ locked: 'נעולה', available: 'זמינה', started: 'התחילה', completed: 'הושלמה', review: 'דורשת חזרה', mastered: 'הושגה שליטה' })[status] || status;
}
function statusBadge(status) {
  const cls = status === 'completed' ? 'badge-success' : status === 'review' ? 'badge-warning' : '';
  return el('span', { className: `badge ${cls}`, text: statusLabel(status) });
}
function lessonCard(lesson) {
  const status = lessonStatus(lesson, settings), locked = status === 'locked', progress = lessonProgressPercent(lesson), p = loadProgress();
  const card = el('article', { className: `card lesson-card ${locked ? 'locked' : ''}` }); card.style.setProperty('--lesson-color', lesson.color);
  const top = el('div', { className: 'lesson-card-top' });
  top.append(el('div', { className: 'lesson-icon', text: locked ? '🔒' : lesson.icon }), statusBadge(status)); card.append(top);
  card.append(el('h3', { text: `${lesson.order}. ${lesson.titleHe}` }), el('p', { text: lesson.learningGoal }));
  const track = el('div', { className: 'progress-track', role: 'progressbar', 'aria-valuenow': String(progress), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': `${progress}% התקדמות` }); track.append(el('div', { className: 'progress-fill', style: `width:${progress}%` })); card.append(track);
  card.append(el('div', { className: 'stat-row' }, [el('span', { className: 'badge', text: `⭐ ${p.lessonStars[lesson.id] || 0}/3` }), el('span', { className: 'badge', text: `${progress}%` })]));
  const row = el('div', { className: 'button-row' });
  const primaryText = status === 'started' ? 'המשך' : status === 'completed' ? 'תרגול חוזר' : 'התחלה';
  row.append(el('button', { className: 'btn btn-primary', type: 'button', text: locked ? 'נעול' : primaryText, disabled: locked ? 'true' : null, onclick: () => !locked && navigate(`lesson/${lesson.id}`) }));
  row.append(el('button', { className: 'btn btn-ghost', type: 'button', text: 'פרטים', onclick: () => navigate(`unit/${lesson.id}`) })); card.append(row); return card;
}

function renderHome() {
  const root = page('', ''); root.querySelector('.page-header').remove();
  const hero = el('section', { className: 'hero' });
  const copy = el('div', { className: 'hero-copy' }); copy.append(el('div', { className: 'badge', text: '🗣️ אנגלית לילדים' }), el('h1', { text: 'קורס לימוד אנגלית לילדים' }), el('p', { text: 'קורס אינטראקטיבי וחווייתי שמקנה לילד או לילדה בסיס איתן באנגלית, מהאותיות והצלילים ועד מילים ומשפטים ראשונים, בקצב אישי.' }));
  const p = loadProgress(), profile = loadProfile();
  copy.append(el('div', { className: 'button-row' }, [button(profile.created ? 'מתחילים ללמוד' : 'יצירת פרופיל והתחלה', profile.created ? 'path' : 'avatar'), button('המשך מהמקום שבו עצרתי', `lesson/lesson-${String(p.currentLesson || 1).padStart(3, '0')}`, 'btn-accent')]));
  hero.append(copy, el('div', { className: 'hero-art', 'aria-hidden': 'true', text: profile.avatar || '🦊' })); root.append(hero);

  const listen = el('section', { className: 'card mascot' }, [el('div', { className: 'mascot-face', text: '🔊' }), el('div', [el('h2', { text: 'האזנה והגייה' }), el('p', { text: 'הילד או הילדה שומעים הגייה נכונה ולומדים לבטא בעצמם, מהיום הראשון.' }), button('למסך ההאזנה', 'listening', 'btn-secondary')])]); root.append(listen);

  const experience = el('section', { className: 'section' }); experience.append(sectionTitle('אנגלית שהופכת לחוויה, לא למטלה'));
  const benefits = el('div', { className: 'grid grid-3' }); [
    ['🎮','לומדים דרך משחק','פעילויות קצרות, משחקי התאמה, סידור אותיות, זיכרון, גרירה ובחירה.'],
    ['🔊','האזנה והגייה','הילד שומע אותיות, צלילים ומילים ויכול להקליט את עצמו חוזר אחריהם.'],
    ['💪','בקצב אישי','אפשר לחזור על כל פעילות ועל כל שיעור ללא הגבלה.']
  ].forEach(([icon,title,text]) => benefits.append(el('article', { className: 'card feature-card' }, [el('div',{className:'feature-icon',text:icon}),el('h3',{text:title}),el('p',{text})]))); experience.append(benefits); root.append(experience);

  const includes = el('section', { className: 'section card' }); includes.append(sectionTitle('מה כולל הקורס?'));
  const includeGrid = el('div', { className: 'grid grid-2' }); ['עשרות פעילויות אינטראקטיביות.','האזנה לאותיות, צלילים ומילים.','הקלטת קול והשמעה חוזרת.','בניית אוצר מילים.','קריאת מילים.','בניית משפטים ראשונים.','משחקי חזרה ותרגול.','שמירת התקדמות מקומית במכשיר.'].forEach(text => includeGrid.append(el('p',{text:`✅ ${text}`}))); includes.append(includeGrid); root.append(includes);

  const pathSection = el('section', { className: 'section' }); pathSection.append(sectionTitle('מסלול הדרגתי'));
  const steps = el('div', { className: 'grid grid-4' }); [['1','אותיות וצלילים','היכרות עם ה־ABC.'],['2','אוצר מילים','מילים מעולמו של הילד.'],['3','קריאה והאזנה','זיהוי וקריאת מילים.'],['4','משפטים ושיחה','משפטים ראשונים באנגלית.']].forEach(([n,title,text])=>steps.append(el('article',{className:'card feature-card'},[el('span',{className:'pill',text:n}),el('h3',{text:title}),el('p',{text})]))); pathSection.append(steps); root.append(pathSection);

  root.append(renderFaqBlock());
  const links = el('div',{className:'footer-links'},[button('מילון אישי','dictionary','btn-ghost'),button('מדבקות','stickers','btn-ghost'),button('מידע על האפליקציה','about','btn-ghost'),button('התקנה','install','btn-ghost')]);root.append(links);
  main.replaceChildren(root);
}

function renderAvatar() {
  const root=page('בחירת אווטאר','בחרו דמות שתלווה את הילד או הילדה במסלול הלימוד.'); const profile=loadProfile();
  const grid=el('div',{className:'avatar-grid card'}); const avatars=['🦊','🐼','🦁','🐳','🦄','🐸','🐵','🐯']; let selected=profile.avatar||'🦊';
  avatars.forEach(icon=>{const b=el('button',{className:'avatar-option',type:'button',text:icon,'aria-label':`בחירת אווטאר ${icon}`,'aria-pressed':String(icon===selected)});b.onclick=()=>{selected=icon;[...grid.children].forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');};grid.append(b)});
  root.append(grid,el('div',{className:'button-row'},[el('button',{className:'btn btn-primary',type:'button',text:'המשך',onclick:()=>{saveProfile({...profile,avatar:selected});navigate('name');}}),button('דלגו','name','btn-ghost')]));main.replaceChildren(root);
}
function renderName() {
  const root=page('איך נקרא לך?','אפשר לכתוב שם פרטי או כינוי. השדה אינו חובה.'); const profile=loadProfile();
  const card=el('section',{className:'card form-field'});card.append(el('label',{for:'child-name',text:'שם או כינוי'}));const input=el('input',{id:'child-name',className:'text-input',type:'text',maxlength:'24',autocomplete:'off',value:profile.name||'',placeholder:'לדוגמה: איתי'});card.append(input);root.append(card,el('div',{className:'button-row'},[el('button',{className:'btn btn-primary',type:'button',text:'שמירה ותחילת המסלול',onclick:()=>{saveProfile({...profile,name:input.value.trim(),created:true});navigate('path');}})]));main.replaceChildren(root);input.focus();
}

function renderPath() {
  const p=loadProgress(), profile=loadProfile(); const root=page(`מסלול הלימוד${profile.name?` של ${profile.name}`:''}`,`${p.completedLessons.length} מתוך 94 יחידות הושלמו · רצף למידה: ${p.streakDays} ימים`);
  const summary=el('section',{className:'grid grid-3'},[
    el('article',{className:'card feature-card'},[el('div',{className:'feature-icon',text:'⭐'}),el('h3',{text:String(p.totalPoints)}),el('p',{text:'נקודות'} )]),
    el('article',{className:'card feature-card'},[el('div',{className:'feature-icon',text:'🏆'}),el('h3',{text:String(p.achievements.length)}),el('p',{text:'הישגים'} )]),
    el('article',{className:'card feature-card'},[el('div',{className:'feature-icon',text:'🧠'}),el('h3',{text:String(p.learnedWords.length)}),el('p',{text:'מילים שנלמדו'} )])]);root.append(summary);
  const map=el('div',{className:'route-map'});course.stages.forEach(stage=>{const block=el('section',{className:'stage-block'});block.append(el('h2',{className:'stage-heading',text:`שלב ${stage.number}: ${stage.title}`}));const grid=el('div',{className:'lesson-grid'});stage.lessonIds.map(id=>lessons.find(l=>l.id===id)).filter(Boolean).forEach(l=>grid.append(lessonCard(l)));block.append(grid);map.append(block)});root.append(map);main.replaceChildren(root);
}
function renderUnits() { const root=page('כל יחידות הלימוד','כל 94 היחידות לפי סדר הקורס.');const grid=el('div',{className:'lesson-grid'});lessons.forEach(l=>grid.append(lessonCard(l)));root.append(grid);main.replaceChildren(root); }
function renderUnit(id) {
  const lesson=lessons.find(l=>l.id===id);if(!lesson){renderNotFound();return;}const root=page(`${lesson.order}. ${lesson.titleHe}`,lesson.titleEn);const status=lessonStatus(lesson,settings);
  const overview=el('section',{className:'grid grid-2'});const info=el('article',{className:'card feature-card'});info.append(statusBadge(status),el('h2',{text:'מטרת היחידה'}),el('p',{text:lesson.learningGoal}),el('h3',{text:'הסבר פשוט'}),el('p',{text:lesson.parentExplanation}),el('h3',{text:'הכלל הנלמד'}),el('p',{text:lesson.rule}));
  const openLessonButton=el('button',{className:'btn btn-primary',type:'button',text:status==='locked'?'היחידה נעולה':status==='started'?'המשך השיעור':'פתיחת השיעור',disabled:status==='locked'?'true':null,onclick:()=>status!=='locked'&&navigate(`lesson/${lesson.id}`)});const stats=el('article',{className:'card feature-card'},[el('h2',{text:'מה מחכה כאן?'}),el('p',{text:`${lesson.words.length} מילים · ${lesson.activities.length} פעילויות · עד ${lesson.rewards.stars} כוכבים`}),el('p',{text:`תנאי השלמה: לפחות ${lesson.completionRules.minimumActivities} פעילויות וציון ${lesson.completionRules.minimumScore}.`}),openLessonButton]);overview.append(info,stats);root.append(overview);
  root.append(sectionTitle('מילות היחידה'));const grid=el('div',{className:'dictionary-grid'});lesson.words.forEach(w=>grid.append(wordCard(w,true)));root.append(grid);if(lesson.exceptions)root.append(el('aside',{className:'install-hint'},[el('strong',{text:'מילה מיוחדת: '}),document.createTextNode(lesson.exceptions)]));main.replaceChildren(root);
}

function wordCard(word, allowPractice=false) {
  const p=loadProgress(), mastery=p.wordMastery[word.id]||{};const card=el('article',{className:'card word-card'});const img=el('img',{className:'word-image',src:word.image,alt:`איור עבור ${word.translation}`,loading:'lazy'});img.onerror=()=>{img.src='assets/images/words/placeholder.svg';};card.append(img,el('div',{className:'word-en',lang:'en',dir:'ltr',text:word.word}),el('div',{text:word.translation}),el('p',{lang:'en',dir:'ltr',text:word.exampleSentence}),el('div',{className:'stat-row'},[el('span',{className:'badge',text:`תרגולים: ${mastery.attempts||0}`}),el('span',{className:'badge',text:`מצב: ${mastery.status||'חדש'}`})]));
  const row=el('div',{className:'button-row'});row.append(el('button',{className:'btn btn-secondary',type:'button',text:'🔊 שמע',onclick:()=>playAudio({src:word.audio,text:word.word}).catch(e=>showToast(e.message))}));if(allowPractice)row.append(el('button',{className:'btn btn-ghost',type:'button',text:'סימון לחזרה',onclick:()=>{markWordForReview(word.id);showToast('המילה נוספה לתרגול שלי.');}}));card.append(row);return card;
}

function renderDictionary() {
  const root=page('המילון האישי','כל המילים שנלמדו, עם תרגום, שמע ומשפט לדוגמה.');const p=loadProgress();const controls=el('section',{className:'card grid grid-3'});const search=el('input',{className:'text-input',type:'search',placeholder:'חיפוש מילה…','aria-label':'חיפוש במילון'});const status=el('select',{className:'select-input','aria-label':'סינון לפי מצב'});[['all','כל המילים'],['learned','מילים שנלמדו'],['review','דורשות חזרה'],['new','מילים חדשות']].forEach(([v,t])=>status.append(el('option',{value:v,text:t})));const letter=el('select',{className:'select-input','aria-label':'סינון לפי אות'});letter.append(el('option',{value:'',text:'כל האותיות'}));'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(c=>letter.append(el('option',{value:c.toLowerCase(),text:c})));controls.append(search,status,letter);root.append(controls);const grid=el('div',{className:'dictionary-grid'});root.append(grid);
  const refresh=()=>{const q=search.value.trim().toLowerCase(),filter=status.value,l=letter.value;const result=words.filter(w=>{const learned=p.learnedWords.includes(w.id),review=p.reviewWords.includes(w.id);return(!q||w.word.toLowerCase().includes(q)||w.translation.includes(q))&&(!l||w.word.toLowerCase().startsWith(l))&&(filter==='all'||filter==='learned'&&learned||filter==='review'&&review||filter==='new'&&!learned);}).slice(0,180);grid.replaceChildren();result.forEach(w=>grid.append(wordCard(w,true)));if(!result.length)grid.append(emptyState('📚','עדיין אין מילים מתאימות לסינון.'));};[search,status,letter].forEach(x=>x.addEventListener('input',refresh));refresh();main.replaceChildren(root);
}
function emptyState(icon,title,text='') { return el('section',{className:'card empty-state'},[el('div',{className:'empty-icon',text:icon}),el('h2',{text:title}),text?el('p',{text}):null]); }

function renderReview() {
  const root=page('התרגול שלי','תרגול מקומי שנבנה מהמילים שדורשות חזרה.');const p=loadProgress();const review=words.filter(w=>p.reviewWords.includes(w.id));
  if(!review.length){root.append(emptyState('🌟','אין כרגע מילים שדורשות חזרה','אפשר להמשיך במסלול או לסמן מילים מהמילון לתרגול נוסף.'),button('חזרה למסלול','path'));main.replaceChildren(root);return;}
  const activity={id:'review-session',type:'audio-match',instruction:'הקשיבו ובחרו את המילה',prompt:review[0].word,audio:review[0].word,answer:review[0].word,options:[...new Set([review[0].word,...words.filter(w=>w.id!==review[0].id).slice(0,3).map(w=>w.word)])],points:20,correctFeedback:'מצוין! המילה נעשתה מוכרת יותר.',retryFeedback:'הקשיבו שוב ונסו תשובה אחרת.'};
  const host=el('div');host.append(renderActivity(activity,{onComplete:()=>showToast('כל הכבוד! אפשר לפתוח תרגול חדש.'),onAttempt:()=>{}}));root.append(host,button('למילון','dictionary','btn-ghost'));main.replaceChildren(root);
}
function renderPractice() {
  const root=page('תרגול חופשי','בחרו דרך קצרה וכיפית לתרגל.');const grid=el('div',{className:'grid grid-3'});[
    ['🧠','התרגול שלי','מילים שדורשות חזרה','review'],['🔊','האזנה','שמיעת מילים ומשפטים','listening'],['🎙️','הקלטת הגייה','להקליט ולהאזין לעצמי','recording'],['🎮','משחק מהיר','פעילות אקראית מהקורס','game'],['📚','מילון אישי','חיפוש ותרגול מילים','dictionary'],['💬','משפטים ראשונים','משפטי יסוד באנגלית','sentences']
  ].forEach(([icon,title,text,route])=>grid.append(el('article',{className:'card feature-card'},[el('div',{className:'feature-icon',text:icon}),el('h2',{text:title}),el('p',{text}),button('פתיחה',route)])));root.append(grid);main.replaceChildren(root);
}
function renderListening() {
  const root=page('האזנה','בחרו מילה או משפט, שמעו בקצב רגיל או לאט.');const selection=words.slice(0,40);const select=el('select',{className:'select-input','aria-label':'בחירת מילה'});selection.forEach(w=>select.append(el('option',{value:w.word,text:`${w.word} — ${w.translation}`})));const prompt=el('div',{className:'activity-prompt',lang:'en',dir:'ltr',text:selection[0].word});select.onchange=()=>prompt.textContent=select.value;const card=el('section',{className:'card activity-card'},[select,prompt,el('div',{className:'audio-control'},[el('button',{className:'audio-play',type:'button',text:'🔊','aria-label':'השמעה רגילה',onclick:()=>playAudio({text:select.value}).catch(e=>showToast(e.message))}),el('button',{className:'audio-play',type:'button',text:'🐢','aria-label':'השמעה איטית',onclick:()=>playAudio({text:select.value,slow:true}).catch(e=>showToast(e.message))})])]);root.append(card);main.replaceChildren(root);
}
function renderRecording() {
  const root=page('הקלטת קול','ההקלטה נשמרת בזיכרון זמני בלבד ונמחקת ביציאה מהמסך.');const activity={id:'free-record',type:'pronunciation-practice',instruction:'הקשיבו, הקליטו את עצמכם והאזינו',prompt:'Hello',audio:'Hello',points:0};root.append(renderActivity(activity,{onComplete:()=>showToast('ניסיון נהדר!'),onAttempt:()=>{}}));main.replaceChildren(root);
}
function renderGame() {
  const root=page('משחק מהיר','פעילות קצרה שנבחרה מתוך היחידה הראשונה.');const source=lessons[Math.min(loadProgress().currentLesson-1,5)]||lessons[0];const activity=source.activities.find(a=>a.type==='memory-game')||source.activities[0];root.append(renderActivity(activity,{onComplete:()=>showToast('סיימתם את המשחק!'),onAttempt:()=>{}}),el('button',{className:'btn btn-secondary',type:'button',text:'משחק נוסף',onclick:renderGame}));main.replaceChildren(root);
}
function renderSentences() {
  const root=page('משפטים ראשונים','משפטים שימושיים עם תרגום ושמע.');const grid=el('div',{className:'dictionary-grid'});sentences.forEach(s=>{const card=el('article',{className:'card word-card'},[el('div',{className:'word-en',lang:'en',dir:'ltr',text:s.text}),el('p',{text:s.translation}),el('div',{className:'button-row'},[el('button',{className:'btn btn-secondary',type:'button',text:'🔊 שמע',onclick:()=>playAudio({text:s.text}).catch(e=>showToast(e.message))}),el('button',{className:'btn btn-ghost',type:'button',text:'סידור משפט',onclick:()=>renderSentenceActivity(s)})])]);grid.append(card)});root.append(grid);main.replaceChildren(root);
}
function renderSentenceActivity(sentence) { const root=page('בניית משפט',sentence.translation);const clean=sentence.text.replace('…','').replace('?','').replace('.','').trim();const activity={id:`build-${sentence.id}`,type:'sentence-builder',instruction:'סדרו את המילים למשפט',answer:clean,options:clean.split(/\s+/),points:20};root.append(renderActivity(activity,{onComplete:()=>showToast('המשפט מסודר נכון!'),onAttempt:()=>{}}),button('חזרה למשפטים','sentences','btn-ghost'));main.replaceChildren(root); }

function renderAchievements() {
  const root=page('הישגים','הכוכבים, הגביעים ותגי ההישג נשמרים במכשיר.');const p=loadProgress();const grid=el('div',{className:'grid grid-3'});rewards.achievements.forEach(a=>{const earned=p.achievements.includes(a.id);grid.append(el('article',{className:`card feature-card ${earned?'':'locked'}`},[el('div',{className:'feature-icon',text:earned?a.icon:'🔒'}),el('h2',{text:a.title}),el('p',{text:earned?'הושג! כל הכבוד.':'עדיין לא הושג — ממשיכים ללמוד.'})]))});root.append(grid,el('div',{className:'button-row'},[button('למדבקות','stickers','btn-secondary'),button('למסלול','path','btn-ghost')]));main.replaceChildren(root);
}
function renderStickers() { const root=page('המדבקות שלי','כל מדבקה נפתחת לאחר השלמת יחידה.');const p=loadProgress();const grid=el('div',{className:'grid grid-4'});rewards.stickers.forEach(s=>{const earned=p.stickers.includes(s.id);grid.append(el('article',{className:'card feature-card'},[el('div',{className:'feature-icon',text:earned?s.icon:'◻️'}),el('h3',{text:s.title}),el('p',{text:earned?'נפתחה':'עדיין נעולה'})]))});root.append(grid);main.replaceChildren(root); }

function toggleSettingRow(label,key) { const row=el('div',{className:'card toggle-row'});row.append(el('div',[el('strong',{text:label})]));const toggle=el('button',{className:'toggle',type:'button',role:'switch','aria-checked':String(!!settings[key]),'aria-label':label});toggle.onclick=()=>{settings[key]=!settings[key];toggle.setAttribute('aria-checked',String(settings[key]));saveSettings(settings);applyAccessibility(settings);};row.append(toggle);return row; }
function renderSettings() {
  const root=page('הגדרות','כל ההגדרות נשמרות רק במכשיר.');const list=el('section',{className:'settings-list'});list.append(toggleSettingRow('מוזיקה', 'music'),toggleSettingRow('אנימציות','animations'),toggleSettingRow('אנימציות מצומצמות','reducedMotion'),toggleSettingRow('ניגודיות גבוהה','highContrast'),toggleSettingRow('פתיחת כל השיעורים','unlockAll'));
  const volume=el('input',{type:'range',min:'0',max:'1',step:'0.1',value:String(settings.volume),'aria-label':'עוצמת שמע'});volume.oninput=()=>{settings.volume=Number(volume.value);saveSettings(settings)};list.append(el('div',{className:'card form-field'},[el('label',{text:'עוצמת שמע'}),volume]));
  const rate=el('select',{className:'select-input','aria-label':'מהירות השמעה'});[[.65,'איטית'],[.85,'רגילה לילדים'],[1,'רגילה']].forEach(([v,t])=>rate.append(el('option',{value:String(v),text:t,selected:Number(settings.speechRate)===v?'selected':null})));rate.onchange=()=>{settings.speechRate=Number(rate.value);saveSettings(settings)};list.append(el('div',{className:'card form-field'},[el('label',{text:'מהירות השמעה'}),rate]));
  const textSize=el('select',{className:'select-input','aria-label':'גודל טקסט'});[['medium','רגיל'],['large','גדול'],['xlarge','גדול מאוד']].forEach(([v,t])=>textSize.append(el('option',{value:v,text:t,selected:settings.textSize===v?'selected':null})));textSize.onchange=()=>{settings.textSize=textSize.value;saveSettings(settings);applyAccessibility(settings)};list.append(el('div',{className:'card form-field'},[el('label',{text:'גודל טקסט'}),textSize]));
  const dataCard=el('section',{className:'card feature-card'},[el('h2',{text:'גיבוי ונתונים מקומיים'})]);const exportBtn=el('button',{className:'btn btn-secondary',type:'button',text:'ייצוא התקדמות ל־JSON',onclick:downloadBackup});const file=el('input',{type:'file',accept:'application/json,.json',className:'screen-reader-only',id:'import-file'});const importBtn=el('button',{className:'btn btn-ghost',type:'button',text:'ייבוא גיבוי',onclick:()=>file.click()});file.onchange=()=>handleImport(file.files?.[0]);const resetBtn=el('button',{className:'btn btn-danger',type:'button',text:'איפוס כל ההתקדמות',onclick:()=>confirmAction('איפוס התקדמות','כל השיעורים, הנקודות וההישגים יימחקו מהמכשיר.',()=>{resetProgress();showToast('ההתקדמות אופסה.');renderSettings();})});const clearBtn=el('button',{className:'btn btn-danger',type:'button',text:'ניקוי כל הנתונים המקומיים',onclick:()=>confirmAction('ניקוי כל הנתונים','גם הפרופיל וההגדרות יימחקו מהמכשיר.',()=>{clearAllLocalData();location.reload();})});dataCard.append(el('div',{className:'button-row'},[exportBtn,importBtn,resetBtn,clearBtn]),file);list.append(dataCard);
  list.append(el('section',{className:'card feature-card'},[el('h2',{text:'האפליקציה'}),el('p',{text:`גרסה ${settings.version||'1.0.0'}`}),button('התקנת האפליקציה','install','btn-primary'),button('אפשרויות נגישות','accessibility','btn-ghost'),button('שאלות נפוצות','faq','btn-ghost'),button('מידע על האפליקציה','about','btn-ghost')]));root.append(list);main.replaceChildren(root);
}
function downloadBackup(){const blob=exportProgress(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`english-kids-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('קובץ הגיבוי הורד למכשיר.');}
async function handleImport(file){if(!file)return;try{const payload=JSON.parse(await file.text());importProgress(payload);showToast('הגיבוי שוחזר בהצלחה.');updateChrome();renderSettings();}catch(error){showToast(error.message||'לא ניתן לייבא את הקובץ.');}}
function confirmAction(title,text,onConfirm){dialog.replaceChildren();const body=el('div',{className:'dialog-body'},[el('h2',{text:title}),el('p',{text}),el('div',{className:'button-row'},[el('button',{className:'btn btn-danger',type:'button',text:'אישור',onclick:()=>{dialog.close();onConfirm();}}),el('button',{className:'btn btn-ghost',type:'button',text:'ביטול',onclick:()=>dialog.close()})])]);dialog.append(body);dialog.showModal();}

function renderAccessibility() { const root=page('נגישות','אפשר להתאים את התצוגה והשמע לצורכי הילד או הילדה.');root.append(el('section',{className:'card feature-card'},[el('h2',{text:'האפשרויות הקיימות'}),el('p',{text:'גודל טקסט, ניגודיות גבוהה, צמצום אנימציות, ניווט במקלדת, Focus ברור, טקסט מקביל לשמע ומהירות השמעה.'}),button('פתיחת ההגדרות','settings')]));main.replaceChildren(root); }
function renderFaqBlock(){const section=el('section',{className:'section accordion'});section.append(sectionTitle('שאלות נפוצות'));[
['לאיזה גיל הקורס מתאים?','הקורס מתאים לילדי גן ובית הספר היסודי שמתחילים ללמוד אנגלית או רוצים לחזק את הבסיס.'],['האם נדרש ידע קודם?','לא. הקורס מתחיל מהאותיות והצלילים הראשונים.'],['האם אפשר לחזור על שיעורים?','כן. אפשר לחזור על כל שיעור וכל פעילות ללא הגבלה.'],['האם האפליקציה עובדת ללא אינטרנט?','כן. לאחר הטעינה הראשונה ניתן להשתמש בתכנים שנשמרו במכשיר.'],['האם נשמר מידע על הילד?','ההתקדמות נשמרת רק במכשיר המקומי ואינה נשלחת לשרת.']
].forEach(([q,a])=>section.append(el('details',{},[el('summary',{text:q}),el('p',{text:a})])));return section;}
function renderFaq(){const root=page('שאלות נפוצות');root.append(renderFaqBlock());main.replaceChildren(root);}
function renderAbout(){const root=page('מידע על האפליקציה','PWA מקומית ללימוד אנגלית לילדים מתחילים.');root.append(el('section',{className:'card feature-card'},[el('h2',{text:'פרטיות ועבודה מקומית'}),el('p',{text:'אין חשבון, אין שרת, אין פרסומות ואין מעקב. שם, אווטאר והתקדמות נשמרים ב־LocalStorage במכשיר בלבד.'}),el('h2',{text:'שמע והקלטה'}),el('p',{text:'האפליקציה משתמשת בקובצי שמע מקומיים כאשר קיימים וב־SpeechSynthesis כחלופה. הקלטות נשמרות זמנית בלבד ונמחקות ביציאה.'}),el('h2',{text:'תוכן הקורס'}),el('p',{text:'כל 94 היחידות מופיעות במסלול. שש היחידות הראשונות כוללות תוכן הדגמה מלא; יתר היחידות משתמשות באותו מנוע נתונים ופעילויות.'})]));main.replaceChildren(root);}
function renderInstall(){const root=page('התקנת האפליקציה','אפשר להשתמש בדפדפן גם ללא התקנה.');const card=el('section',{className:'card feature-card'});if(deferredInstallPrompt)card.append(el('h2',{text:'התקנה זמינה'}),el('p',{text:'לחצו על הכפתור כדי להתקין את האפליקציה על המכשיר.'}),el('button',{className:'btn btn-primary',type:'button',text:'התקנת האפליקציה',onclick:triggerInstall}));else if(/iphone|ipad|ipod/i.test(navigator.userAgent))card.append(el('h2',{text:'התקנה ב־iPhone או iPad'}),el('div',{className:'install-hint'},[el('p',{text:'1. לחצו על כפתור השיתוף בדפדפן.'}),el('p',{text:'2. בחרו “הוספה למסך הבית”.'})]));else card.append(el('h2',{text:'אפשר להמשיך בדפדפן'}),el('p',{text:'הדפדפן אינו מציע כרגע התקנה. לעיתים האפשרות מופיעה לאחר שימוש קצר או דרך תפריט הדפדפן.'}));root.append(card);main.replaceChildren(root);}
function renderOffline(){const root=page('שימוש ללא אינטרנט','לאחר הטעינה הראשונה, קובצי הליבה והתוכן נשמרים במטמון המכשיר.');root.append(el('section',{className:'card feature-card'},[el('h2',{text:navigator.onLine?'כרגע יש חיבור לאינטרנט':'כרגע האפליקציה במצב Offline'}),el('p',{text:'במצב ללא אינטרנט ניתן לפתוח שיעורים שכבר נשמרו, לתרגל, לשמור התקדמות ולהשתמש בהקלטה. יכולות קול תלויות בתמיכת הדפדפן ובקולות שכבר מותקנים במכשיר.'})]));main.replaceChildren(root);}
function renderNotFound(){const root=page('המסך לא נמצא');root.append(emptyState('🧭','לא מצאנו את המסך המבוקש'),button('חזרה לבית','home'));main.replaceChildren(root);}

async function routeTo(route){cleanupLesson();cleanupActivity();updateChrome(route);const {path,parts}=parseRoute(route);try{
  if(path==='home'||path==='welcome')renderHome();else if(path==='avatar')renderAvatar();else if(path==='name')renderName();else if(path==='path')renderPath();else if(path==='units')renderUnits();else if(path==='unit')renderUnit(parts[0]);else if(path==='lesson'){const lesson=await loadLesson(parts[0]);if(!lesson)renderNotFound();else renderLesson(lesson,main);}else if(path==='dictionary')renderDictionary();else if(path==='review')renderReview();else if(path==='practice')renderPractice();else if(path==='listening')renderListening();else if(path==='recording')renderRecording();else if(path==='game')renderGame();else if(path==='sentences')renderSentences();else if(path==='achievements')renderAchievements();else if(path==='stickers')renderStickers();else if(path==='settings')renderSettings();else if(path==='accessibility')renderAccessibility();else if(path==='faq')renderFaq();else if(path==='about')renderAbout();else if(path==='install')renderInstall();else if(path==='offline')renderOffline();else renderNotFound();
  main.focus({preventScroll:true});window.scrollTo({top:0,behavior:settings.reducedMotion?'auto':'smooth'});
}catch(error){console.error(error);const root=page('לא ניתן לטעון את המסך');root.append(el('section',{className:'card'},[el('p',{text:error.message||'אירעה תקלה לא צפויה.'}),button('חזרה לבית','home')]));main.replaceChildren(root);}}

function updateOnlineState(){offlineBanner.hidden=navigator.onLine;}
async function triggerInstall(){if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installButton.hidden=true;renderInstall();}
async function init(){
  [course,lessons,words,sentences,rewards,defaults]=await Promise.all([loadCourse(),loadLessons(),loadWords(),loadSentences(),loadRewards(),loadDefaultSettings()]);settings=loadSettings(defaults);applyAccessibility(settings);updateOnlineState();updateChrome();
  addEventListener('online',updateOnlineState);addEventListener('offline',updateOnlineState);addEventListener('progresschange',()=>updateChrome(location.hash));addEventListener('settingschange',event=>{settings={...defaults,...event.detail};applyAccessibility(settings)});
  addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;installButton.hidden=false;});installButton.addEventListener('click',triggerInstall);addEventListener('appinstalled',()=>{deferredInstallPrompt=null;installButton.hidden=true;showToast('האפליקציה הותקנה בהצלחה.');});
  if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./service-worker.js');}catch(error){console.warn('Service Worker registration failed',error);}}
  onRouteChange(routeTo);startRouter();
}
init().catch(error=>{console.error(error);main.replaceChildren(el('section',{className:'card empty-state'},[el('div',{className:'empty-icon',text:'⚠️'}),el('h1',{text:'האפליקציה לא נטענה'}),el('p',{text:'יש לפתוח את הפרויקט דרך שרת מקומי או אחסון סטטי, ולא ישירות כקובץ file://.'})]));});
