import json, re, os
from pathlib import Path

ROOT = Path('/mnt/data/english-kids-pwa')

stages = [
(1, 'בסיס, אותיות וקריאה ראשונית', [
'הגיית אותיות #1','קריאת מילים #1','הגיית אותיות #2','קריאת מילים #2','הגיית אותיות #3','קריאת מילים #3','התנועות Oo Aa Uu','התנועות Ee Ii','האות Ll','צירוף האותיות all','קריאת מילים בנות 4 אותיות','סיומת ss','רצף האותיות ck','קריאת מילים בנות 5 אותיות','צירוף האותיות sh','יוצאי דופן #1','צירוף האותיות ch','רצף האותיות ng','צירוף האותיות th','יוצאי דופן th','קריאת מילים בנות שתי הברות','קריאת מילים שבהן ההברה השנייה היא o','אוצר מילים – הפכים']),
(2, 'הצליל A וצירופיו', ['צירוף האותיות ay','צירוף התנועות ai','סיומת air','צירוף התנועות a-e','סיומת are','יוצאי דופן #2']),
(3, 'הצליל E וצירופיו', ['צירוף התנועות ee','צירוף התנועות e-e','צירוף התנועות ea בהגיית ee','צירוף התנועות ea בהגיית e','יוצאי דופן ea','סיומת ey','סיומת y בהגיית אִי']),
(4, 'הצליל I וצירופיו', ['סיומת y בהגיית אַי','צירוף התנועות ie בהגיית אַי','צירוף התנועות i-e','סיומת ive','צירוף האותיות igh','סיומת ind','סיומת le עם תנועה קצרה','סיומת le עם תנועה ארוכה']),
(5, 'צלילים מיוחדים', ['הצירופים ce / ci / cy','הצירופים ge / gi / gy','צירוף האותיות gu','צירוף התנועות ie בהגיית ee']),
(6, 'מספרים בסיסיים', ['מספרים 0 עד 10','מספרים 11 עד 20']),
(7, 'הצליל O וצירופיו', ['צירוף האותיות wa','צירוף התנועות oi','צירוף התנועות oa','צירוף התנועות o-e','יוצאי דופן o-e','סיומת o / oe','יוצאי דופן o / oe','צירוף האותיות ow בהגיית o','צירוף האותיות ow בהגיית aw','צירוף התנועות ou','יוצאי דופן ou','צירוף האותיות a / ough','יוצאי דופן a / ough','צירוף האותיות aw']),
(8, 'מספרים מתקדמים וצלילי S', ['עשרות, מאה ואלף','סיומת se בהגיית s','סיומת se בהגיית z']),
(9, 'הצליל U וצירופיו', ['צירוף התנועות oo בהגייה ארוכה','צירוף התנועות oo בהגייה קצרה','תנועת u – הגייה #2','צירוף האותיות oul','צירוף התנועות ui','צירוף התנועות ue','צירוף התנועות u-e','צירוף האותיות ew','צירוף האותיות qu']),
(10, 'הרחבת אוצר מילים וכללי קריאה', ['אוצר מילים – מילים נרדפות','צירוף האותיות ph','סיומת er – מקצועות','סיומת er – שמות עצם','תנועת u – הגייה #3','ימות השבוע','k שקטה','b שקטה','h שקטה','t שקטה','l שקטה','אוצר מילים – איברי גוף','מילים מורכבות','חודשי השנה']),
(11, 'הכרת האלפבית', ['אותיות גדולות וקטנות','הסבר ללימוד שמות האותיות והסדר שלהן','לימוד שמות האותיות','תרגול סדר האותיות'])
]

assert sum(len(x[2]) for x in stages) == 94

# Eight reading examples per unit. The first six are curated as the fully working MVP.
word_sets = [
['sun','sock','apple','ant','top','ten','pen','pig'],
['cat','sat','tap','pat','pan','pin','sit','tip'],
['map','moon','net','nose','dog','duck','goat','game'],
['man','mat','nap','nod','dig','gap','gum','mug'],
['cat','cup','kid','key','egg','elf','red','run'],
['hen','bed','red','leg','kid','lip','rug','sun'],
['hot','box','cat','map','sun','cup','dog','bus'],
['bed','hen','red','pen','sit','pig','fish','milk'],
['leg','lamp','leaf','lion','log','lip','bell','blue'],
['ball','call','fall','hall','mall','tall','wall','small'],
['frog','hand','milk','nest','pink','jump','duck','fish'],
['class','dress','glass','grass','kiss','miss','press','cross'],
['back','black','clock','duck','kick','neck','rock','sock'],
['apple','black','clock','dress','green','house','smile','table'],
['fish','ship','shop','shoe','sheep','shell','brush','dish'],
['one','two','said','was','are','have','come','some'],
['chair','cheese','chick','chin','lunch','peach','teacher','watch'],
['king','ring','sing','song','long','wing','strong','swing'],
['thin','thick','three','thumb','bath','teeth','moth','path'],
['the','this','that','these','those','they','them','there'],
['rabbit','picnic','sunset','dentist','basket','kitten','window','robot'],
['lemon','melon','ribbon','button','dragon','apron','robot','parrot'],
['big','small','hot','cold','fast','slow','happy','sad'],
['day','play','say','stay','gray','tray','may','way'],
['rain','train','tail','mail','paint','wait','sail','brain'],
['hair','chair','fair','pair','stairs','air','repair','fairy'],
['cake','game','name','plane','snake','late','gate','wave'],
['care','share','square','rare','prepare','scare','compare','bare'],
['any','many','said','again','water','what','was','want'],
['see','tree','green','feet','sleep','sheep','week','three'],
['these','theme','complete','athlete','concrete','delete','extreme','Chinese'],
['eat','read','sea','tea','clean','dream','speak','beach'],
['bread','head','read','heavy','weather','feather','ready','breakfast'],
['great','break','steak','bear','wear','heart','earth','learn'],
['key','monkey','honey','money','donkey','turkey','valley','journey'],
['happy','baby','funny','sunny','candy','family','puppy','city'],
['my','by','fly','sky','try','cry','dry','why'],
['pie','tie','lie','die','fries','cried','tried','spies'],
['bike','kite','time','five','smile','white','drive','nine'],
['five','drive','dive','hive','alive','arrive','survive','live'],
['high','light','night','right','sight','bright','flight','might'],
['find','kind','mind','blind','behind','remind','grind','wind'],
['apple','little','bottle','middle','puzzle','candle','simple','jungle'],
['table','cable','maple','stable','title','cycle','noble','rifle'],
['city','cent','cycle','face','rice','pencil','cinema','spicy'],
['giant','giraffe','gym','gem','magic','age','gentle','engine'],
['guitar','guess','guide','guest','guard','guilty','guinea','language'],
['field','piece','chief','thief','belief','brief','niece','shield'],
['zero','one','two','three','four','five','six','seven'],
['eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','twenty'],
['was','want','wash','watch','water','warm','wall','wander'],
['coin','oil','point','voice','join','soil','boil','noise'],
['boat','coat','goat','road','soap','toast','float','throat'],
['home','nose','rose','bone','phone','stone','close','hope'],
['come','some','done','love','move','lose','one','none'],
['no','go','so','toe','hoe','hero','potato','tomato'],
['do','to','who','shoe','canoe','two','move','lose'],
['snow','show','grow','slow','yellow','window','bowl','rainbow'],
['cow','how','now','down','town','brown','flower','shower'],
['out','house','mouse','mouth','cloud','round','sound','ground'],
['young','touch','country','soup','group','could','would','should'],
['all','ball','call','talk','walk','chalk','thought','bought'],
['laugh','enough','though','through','tough','cough','rough','daughter'],
['saw','paw','draw','straw','yawn','lawn','jaw','crawl'],
['ten','twenty','thirty','forty','fifty','hundred','thousand','million'],
['house','mouse','case','base','promise','course','nurse','purse'],
['nose','rose','cheese','please','use','close','wise','rise'],
['moon','food','room','school','spoon','tooth','boot','pool'],
['book','cook','foot','good','look','wood','wool','hook'],
['put','pull','push','full','bull','bush','pudding','cushion'],
['could','would','should','shoulder','soul','boulder','mould','poultry'],
['fruit','suit','juice','cruise','bruise','build','biscuit','guitar'],
['blue','glue','true','clue','Tuesday','rescue','value','argue'],
['cube','cute','use','tune','flute','huge','June','rule'],
['new','few','grew','drew','flew','chew','threw','stew'],
['queen','quick','quiet','quiz','quilt','question','square','squirrel'],
['big','large','small','tiny','happy','glad','fast','quick'],
['phone','photo','dolphin','elephant','graph','alphabet','pharmacy','trophy'],
['teacher','farmer','baker','singer','driver','dancer','painter','writer'],
['river','flower','ladder','paper','water','number','sister','winter'],
['burn','turn','hurt','nurse','purple','turtle','Thursday','burger'],
['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','today'],
['knee','knife','know','knock','knot','knit','knight','kneel'],
['lamb','comb','thumb','climb','bomb','crumb','doubt','debt'],
['hour','honest','honor','heir','ghost','rhyme','rhythm','vehicle'],
['listen','castle','whistle','fasten','Christmas','soften','often','ballet'],
['walk','talk','calm','half','could','would','should','salmon'],
['head','hand','arm','leg','foot','eye','ear','mouth'],
['football','bedroom','rainbow','toothbrush','playground','sunflower','notebook','snowman'],
['January','February','March','April','May','June','July','August'],
['A / a','B / b','C / c','D / d','E / e','F / f','G / g','H / h'],
['A','B','C','D','E','F','G','H'],
['I','J','K','L','M','N','O','P'],
['Q','R','S','T','U','V','W','X']
]
assert len(word_sets) == 94, len(word_sets)

translations = {
'A':'האות A','B':'האות B','C':'האות C','D':'האות D','E':'האות E','F':'האות F','G':'האות G','H':'האות H','I':'האות I','J':'האות J','K':'האות K','L':'האות L','M':'האות M','N':'האות N','O':'האות O','P':'האות P','Q':'האות Q','R':'האות R','S':'האות S','T':'האות T','U':'האות U','V':'האות V','W':'האות W','X':'האות X','A / a':'A גדולה ו־a קטנה','B / b':'B גדולה ו־b קטנה','C / c':'C גדולה ו־c קטנה','D / d':'D גדולה ו־d קטנה','E / e':'E גדולה ו־e קטנה','F / f':'F גדולה ו־f קטנה','G / g':'G גדולה ו־g קטנה','H / h':'H גדולה ו־h קטנה','all':'כולם / כל','glue':'דבק','sun':'שמש','sock':'גרב','apple':'תפוח','ant':'נמלה','top':'סביבון','ten':'עשר','pen':'עט','pig':'חזיר',
'cat':'חתול','sat':'ישב','tap':'טפיחה','pat':'טפיחה עדינה','pan':'מחבת','pin':'סיכה','sit':'לשבת','tip':'קצה',
'map':'מפה','moon':'ירח','net':'רשת','nose':'אף','dog':'כלב','duck':'ברווז','goat':'עז','game':'משחק',
'man':'איש','mat':'שטיחון','nap':'תנומה','nod':'הנהון','dig':'לחפור','gap':'רווח','gum':'מסטיק','mug':'ספל',
'cup':'כוס','kid':'ילד','key':'מפתח','egg':'ביצה','elf':'שדון','red':'אדום','run':'לרוץ','hen':'תרנגולת','bed':'מיטה','leg':'רגל','lip':'שפה','rug':'שטיח',
'hot':'חם','box':'קופסה','bus':'אוטובוס','fish':'דג','milk':'חלב','lamp':'מנורה','leaf':'עלה','lion':'אריה','log':'בול עץ','bell':'פעמון','blue':'כחול',
'ball':'כדור','call':'להתקשר','fall':'ליפול','hall':'מסדרון','mall':'קניון','tall':'גבוה','wall':'קיר','small':'קטן',
'frog':'צפרדע','hand':'יד','nest':'קן','pink':'ורוד','jump':'לקפוץ','class':'כיתה','dress':'שמלה','glass':'כוס זכוכית','grass':'דשא','kiss':'נשיקה','miss':'להחמיץ','press':'ללחוץ','cross':'לחצות',
'back':'גב','black':'שחור','clock':'שעון','kick':'לבעוט','neck':'צוואר','rock':'סלע','green':'ירוק','house':'בית','smile':'חיוך','table':'שולחן',
'ship':'ספינה','shop':'חנות','shoe':'נעל','sheep':'כבשה','shell':'קונכייה','brush':'מברשת','dish':'צלחת',
'one':'אחת','two':'שתיים','said':'אמר','was':'היה','are':'הם / הן','have':'יש','come':'לבוא','some':'כמה',
'chair':'כיסא','cheese':'גבינה','chick':'אפרוח','chin':'סנטר','lunch':'ארוחת צהריים','peach':'אפרסק','teacher':'מורה','watch':'שעון יד / לצפות',
'king':'מלך','ring':'טבעת','sing':'לשיר','song':'שיר','long':'ארוך','wing':'כנף','strong':'חזק','swing':'נדנדה',
'thin':'דק','thick':'עבה','three':'שלוש','thumb':'אגודל','bath':'אמבטיה','teeth':'שיניים','moth':'עש','path':'שביל',
'the':'ה־','this':'זה','that':'ההוא / ההיא','these':'אלה','those':'ההם / ההן','they':'הם / הן','them':'אותם / אותן','there':'שם',
'rabbit':'ארנב','picnic':'פיקניק','sunset':'שקיעה','dentist':'רופא שיניים','basket':'סל','kitten':'חתלתול','window':'חלון','robot':'רובוט',
'lemon':'לימון','melon':'מלון','ribbon':'סרט','button':'כפתור','dragon':'דרקון','apron':'סינר','parrot':'תוכי',
'big':'גדול','cold':'קר','fast':'מהיר','slow':'איטי','happy':'שמח','sad':'עצוב','day':'יום','play':'לשחק','say':'לומר','stay':'להישאר','gray':'אפור','tray':'מגש','may':'עשוי / מאי','way':'דרך',
'rain':'גשם','train':'רכבת','tail':'זנב','mail':'דואר','paint':'לצבוע','wait':'לחכות','sail':'מפרש','brain':'מוח',
'hair':'שיער','fair':'הוגן','pair':'זוג','stairs':'מדרגות','air':'אוויר','repair':'לתקן','fairy':'פיה',
'cake':'עוגה','name':'שם','plane':'מטוס','snake':'נחש','late':'מאוחר','gate':'שער','wave':'גל',
'care':'אכפתיות','share':'לשתף','square':'ריבוע','rare':'נדיר','prepare':'להתכונן','scare':'להפחיד','compare':'להשוות','bare':'חשוף',
'any':'כלשהו','many':'הרבה','again':'שוב','water':'מים','what':'מה','want':'לרצות',
'see':'לראות','tree':'עץ','feet':'כפות רגליים','sleep':'לישון','week':'שבוע','theme':'נושא','complete':'להשלים','athlete':'ספורטאי','concrete':'בטון','delete':'למחוק','extreme':'קיצוני','Chinese':'סיני / סינית',
'eat':'לאכול','read':'לקרוא','sea':'ים','tea':'תה','clean':'נקי','dream':'חלום','speak':'לדבר','beach':'חוף',
'bread':'לחם','head':'ראש','heavy':'כבד','weather':'מזג אוויר','feather':'נוצה','ready':'מוכן','breakfast':'ארוחת בוקר',
'great':'נהדר','break':'הפסקה','steak':'סטייק','bear':'דוב','wear':'ללבוש','heart':'לב','earth':'כדור הארץ','learn':'ללמוד',
'monkey':'קוף','honey':'דבש','money':'כסף','donkey':'חמור','turkey':'תרנגול הודו','valley':'עמק','journey':'מסע','baby':'תינוק','funny':'מצחיק','sunny':'שמשי','candy':'ממתק','family':'משפחה','puppy':'כלבלב','city':'עיר',
'my':'שלי','by':'ליד / באמצעות','fly':'לעוף','sky':'שמיים','try':'לנסות','cry':'לבכות','dry':'יבש','why':'למה','pie':'פאי','tie':'עניבה','lie':'לשכב / לשקר','die':'למות','fries':'צ׳יפס','cried':'בכה','tried':'ניסה','spies':'מרגלים',
'bike':'אופניים','kite':'עפיפון','time':'זמן','five':'חמש','white':'לבן','drive':'לנהוג','nine':'תשע','dive':'לצלול','hive':'כוורת','alive':'חי','arrive':'להגיע','survive':'לשרוד','live':'לחיות',
'high':'גבוה','light':'אור','night':'לילה','right':'ימין / נכון','sight':'מראה','bright':'בהיר','flight':'טיסה','might':'אולי',
'find':'למצוא','kind':'אדיב / סוג','mind':'מחשבה','blind':'עיוור','behind':'מאחור','remind':'להזכיר','grind':'לטחון','wind':'רוח',
'little':'קטן','bottle':'בקבוק','middle':'אמצע','puzzle':'פאזל','candle':'נר','simple':'פשוט','jungle':'ג׳ונגל','cable':'כבל','maple':'אדר','stable':'יציב','title':'כותרת','cycle':'מחזור','noble':'אצילי','rifle':'רובה',
'cent':'סנט','face':'פנים','rice':'אורז','pencil':'עיפרון','cinema':'קולנוע','spicy':'חריף','giant':'ענק','giraffe':'ג׳ירפה','gym':'חדר כושר','gem':'אבן חן','magic':'קסם','age':'גיל','gentle':'עדין','engine':'מנוע',
'guitar':'גיטרה','guess':'לנחש','guide':'מדריך','guest':'אורח','guard':'שומר','guilty':'אשם','guinea':'גינאה','language':'שפה','field':'שדה','piece':'חתיכה','chief':'ראשי','thief':'גנב','belief':'אמונה','brief':'קצר','niece':'אחיינית','shield':'מגן',
'zero':'אפס','four':'ארבע','six':'שש','seven':'שבע','eleven':'אחת עשרה','twelve':'שתים עשרה','thirteen':'שלוש עשרה','fourteen':'ארבע עשרה','fifteen':'חמש עשרה','sixteen':'שש עשרה','seventeen':'שבע עשרה','twenty':'עשרים',
'wash':'לשטוף','warm':'חמים','wander':'לשוטט','coin':'מטבע','oil':'שמן','point':'נקודה','voice':'קול','join':'להצטרף','soil':'אדמה','boil':'להרתיח','noise':'רעש',
'boat':'סירה','coat':'מעיל','road':'כביש','soap':'סבון','toast':'טוסט','float':'לצוף','throat':'גרון','home':'בית','rose':'ורד','bone':'עצם','phone':'טלפון','stone':'אבן','close':'לסגור / קרוב','hope':'תקווה','done':'מוכן','love':'אהבה','move':'לזוז','lose':'לאבד','none':'אף אחד',
'no':'לא','go':'ללכת','so':'כך','toe':'בוהן','hoe':'מעדר','hero':'גיבור','potato':'תפוח אדמה','tomato':'עגבנייה','do':'לעשות','to':'אל','who':'מי','canoe':'קאנו','snow':'שלג','show':'להראות','grow':'לגדול','yellow':'צהוב','bowl':'קערה','rainbow':'קשת בענן','cow':'פרה','how':'איך','now':'עכשיו','down':'למטה','town':'עיירה','brown':'חום','flower':'פרח','shower':'מקלחת',
'out':'בחוץ','mouse':'עכבר','mouth':'פה','cloud':'ענן','round':'עגול','sound':'צליל','ground':'קרקע','young':'צעיר','touch':'לגעת','country':'מדינה','soup':'מרק','group':'קבוצה','could':'יכול היה','would':'היה רוצה','should':'צריך',
'talk':'לדבר','walk':'ללכת','chalk':'גיר','thought':'מחשבה','bought':'קנה','laugh':'לצחוק','enough':'מספיק','though':'למרות ש־','through':'דרך','tough':'קשוח','cough':'שיעול','rough':'מחוספס','daughter':'בת','saw':'ראה / מסור','paw':'כף רגל של חיה','draw':'לצייר','straw':'קש','yawn':'פיהוק','lawn':'מדשאה','jaw':'לסת','crawl':'לזחול',
'thirty':'שלושים','forty':'ארבעים','fifty':'חמישים','hundred':'מאה','thousand':'אלף','million':'מיליון','case':'מקרה','base':'בסיס','promise':'הבטחה','course':'קורס','nurse':'אח / אחות','purse':'ארנק','please':'בבקשה','use':'להשתמש','wise':'חכם','rise':'לעלות',
'food':'אוכל','room':'חדר','school':'בית ספר','spoon':'כף','tooth':'שן','boot':'מגף','pool':'בריכה','book':'ספר','cook':'לבשל','foot':'כף רגל','good':'טוב','look':'להסתכל','wood':'עץ','wool':'צמר','hook':'וו',
'put':'לשים','pull':'למשוך','push':'לדחוף','full':'מלא','bull':'שור','bush':'שיח','pudding':'פודינג','cushion':'כרית','shoulder':'כתף','soul':'נשמה','boulder':'סלע גדול','mould':'עובש / תבנית','poultry':'עופות',
'fruit':'פרי','suit':'חליפה','juice':'מיץ','cruise':'שיט','bruise':'חבורה','build':'לבנות','biscuit':'ביסקוויט','true':'נכון','clue':'רמז','Tuesday':'יום שלישי','rescue':'להציל','value':'ערך','argue':'להתווכח','cube':'קובייה','cute':'חמוד','tune':'מנגינה','flute':'חליל','huge':'ענק','June':'יוני','rule':'כלל','new':'חדש','few':'מעט','grew':'גדל','drew':'צייר','flew':'עף','chew':'ללעוס','threw':'זרק','stew':'תבשיל',
'queen':'מלכה','quick':'מהיר','quiet':'שקט','quiz':'חידון','quilt':'שמיכה','question':'שאלה','squirrel':'סנאי','large':'גדול','tiny':'זעיר','glad':'שמח','photo':'תמונה','dolphin':'דולפין','elephant':'פיל','graph':'גרף','alphabet':'אלפבית','pharmacy':'בית מרקחת','trophy':'גביע',
'farmer':'חקלאי','baker':'אופה','singer':'זמר','driver':'נהג','dancer':'רקדן','painter':'צייר','writer':'כותב','river':'נהר','ladder':'סולם','paper':'נייר','number':'מספר','sister':'אחות','winter':'חורף','burn':'לשרוף','turn':'לפנות','hurt':'כואב','purple':'סגול','turtle':'צב','Thursday':'יום חמישי','burger':'המבורגר',
'Monday':'יום שני','Wednesday':'יום רביעי','Friday':'יום שישי','Saturday':'שבת','Sunday':'יום ראשון','today':'היום','knee':'ברך','knife':'סכין','know':'לדעת','knock':'לדפוק','knot':'קשר','knit':'לסרוג','knight':'אביר','kneel':'לכרוע',
'lamb':'טלה','comb':'מסרק','climb':'לטפס','bomb':'פצצה','crumb':'פירור','doubt':'ספק','debt':'חוב','hour':'שעה','honest':'כן','honor':'כבוד','heir':'יורש','ghost':'רוח רפאים','rhyme':'חרוז','rhythm':'קצב','vehicle':'כלי רכב',
'listen':'להקשיב','castle':'טירה','whistle':'שריקה','fasten':'להדק','Christmas':'חג המולד','soften':'לרכך','often':'לעיתים קרובות','ballet':'בלט','calm':'רגוע','half':'חצי','salmon':'סלמון','arm':'זרוע','eye':'עין','ear':'אוזן',
'football':'כדורגל','bedroom':'חדר שינה','toothbrush':'מברשת שיניים','playground':'מגרש משחקים','sunflower':'חמנייה','notebook':'מחברת','snowman':'איש שלג',
'January':'ינואר','February':'פברואר','March':'מרץ','April':'אפריל','May':'מאי','July':'יולי','August':'אוגוסט'
}

# English titles kept concise and editable.
def english_title(he, index):
    replacements = {
        'הגיית אותיות':'Letter Sounds','קריאת מילים':'Reading Words','התנועות':'Vowels','האות':'The Letter',
        'צירוף האותיות':'Letter Pattern','צירוף התנועות':'Vowel Pattern','סיומת':'Ending','רצף האותיות':'Letter Sequence',
        'יוצאי דופן':'Special Words','אוצר מילים':'Vocabulary','מספרים':'Numbers','אותיות גדולות וקטנות':'Uppercase and Lowercase Letters',
        'לימוד שמות האותיות':'Letter Names','תרגול סדר האותיות':'Alphabet Order Practice'
    }
    for k,v in replacements.items():
        if he.startswith(k):
            tail = he[len(k):].strip(' –')
            return (v + (' ' + tail if tail else '')).strip()
    return f'English Unit {index}'

def slugify(s):
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9]+','-',s)
    return s.strip('-') or 'item'

def word_obj(word, lesson_id, idx, full=False):
    clean = re.sub(r'[^A-Za-z]','',word).lower() or f'letter-{idx}'
    tr = translations.get(word, translations.get(word.lower(), f'תרגול קריאה: {word}'))
    sentence_word = word.split('/')[0].strip()
    if full:
        sentence = {
            'sun':'The sun is hot.','sock':'This is my sock.','apple':'I see an apple.','ant':'The ant is small.',
            'top':'The top can spin.','ten':'I have ten blocks.','pen':'This is a blue pen.','pig':'The pig is pink.',
            'cat':'The cat is small.','sat':'The cat sat.','tap':'Tap the box.','pat':'Pat the dog.','pan':'The pan is hot.',
            'pin':'I see a pin.','sit':'Sit on the mat.','tip':'Touch the tip.','map':'This is a map.','moon':'The moon is bright.',
            'net':'The ball is in the net.','nose':'This is my nose.','dog':'The dog can run.','duck':'The duck can swim.',
            'goat':'The goat is white.','game':'I like this game.','man':'The man has a hat.','mat':'The cat is on the mat.',
            'nap':'The baby has a nap.','nod':'Nod your head.','dig':'The dog can dig.','gap':'Jump over the gap.',
            'gum':'I have gum.','mug':'The mug is red.','cup':'The cup is blue.','kid':'The kid can jump.',
            'key':'This is a key.','egg':'I see an egg.','elf':'The elf is small.','red':'The ball is red.',
            'run':'I can run.','hen':'The hen is in the yard.','bed':'The bed is soft.','leg':'This is my leg.',
            'lip':'Touch your lip.','rug':'The rug is green.'
        }.get(word, f'I see the word {sentence_word}.')
    else:
        sentence = f'I can read {sentence_word}.'
    return {
        'id': f'{lesson_id}-word-{idx+1}', 'word': word, 'translation': tr,
        'image': 'assets/images/words/placeholder.svg', 'audio': '',
        'exampleSentence': sentence, 'targetSound': '', 'difficulty': 1 if full else 2,
        'topic': 'starter' if full else 'course', 'specialWord': 'יוצאי דופן' in lesson_id
    }

def activity_set(lesson_id, words, full=False):
    w = [x['word'] for x in words]
    first, second, third, fourth = w[:4]
    acts = [
        {'id':f'{lesson_id}-a1','type':'audio-match','instruction':'הקשיבו ובחרו את המילה ששמעתם','prompt':first,'answer':first,'options':[first,second,third,fourth],'audio':first,'points':20,'maxAttempts':3,'correctFeedback':'מצוין! זיהיתם את המילה.','retryFeedback':'כמעט! הקשיבו שוב לצליל.'},
        {'id':f'{lesson_id}-a2','type':'image-match','instruction':'בחרו את המילה שמתאימה לתמונה','prompt':second,'answer':second,'options':[second,first,fourth,third],'image':'assets/images/words/placeholder.svg','points':20,'maxAttempts':3,'correctFeedback':'כל הכבוד!','retryFeedback':'ניסיון נהדר! נסו מילה אחרת.'},
        {'id':f'{lesson_id}-a3','type':'multiple-choice','instruction':'מה התרגום הנכון?','prompt':third,'answer':words[2]['translation'],'options':[words[2]['translation'],words[0]['translation'],words[1]['translation'],words[3]['translation']],'points':20,'maxAttempts':3,'correctFeedback':'הצלחתם!','retryFeedback':'כמעט! קראו שוב ובחרו תשובה אחרת.'},
        {'id':f'{lesson_id}-a4','type':'missing-letter','instruction':'השלימו את האות החסרה','prompt': fourth[0] + '_' + fourth[2:] if len(fourth)>2 else fourth[0]+'_','answer':fourth[1] if len(fourth)>1 else fourth[0],'word':fourth,'options':list(dict.fromkeys([fourth[1] if len(fourth)>1 else fourth[0],'a','e','i'])),'points':20,'maxAttempts':3,'correctFeedback':'איזה יופי! השלמתם את המילה.','retryFeedback':'נסו שוב והקשיבו למילה.'},
        {'id':f'{lesson_id}-a5','type':'word-builder','instruction':'בנו את המילה לפי הסדר','prompt':first,'answer':first,'letters':list(first),'audio':first,'points':30,'maxAttempts':4,'correctFeedback':'עבודה נהדרת! בניתם את המילה.','retryFeedback':'כמעט! אפשר לאפס ולנסות שוב.'},
        {'id':f'{lesson_id}-a6','type':'memory-game','instruction':'מצאו זוגות של מילה ותרגום','pairs':[[x['word'],x['translation']] for x in words[:4]],'points':40,'maxAttempts':99,'correctFeedback':'מצאתם זוג!','retryFeedback':'המשיכו לחפש את הזוג המתאים.'}
    ]
    if full:
        acts.append({'id':f'{lesson_id}-a7','type':'pronunciation-practice','instruction':'הקשיבו, הקליטו את עצמכם והאזינו','prompt':second,'audio':second,'answer':None,'points':20,'maxAttempts':99,'correctFeedback':'ניסיון נהדר!','retryFeedback':'אפשר להקליט שוב או להמשיך.'})
    return acts

lessons=[]
course_stages=[]
order=0
for stage_num, stage_title, names in stages:
    ids=[]
    for name in names:
        order+=1
        lesson_id=f'lesson-{order:03d}'
        full=order<=6
        words=[word_obj(word,lesson_id,i,full) for i,word in enumerate(word_sets[order-1])]
        for item in words:
            item['specialWord'] = 'יוצאי דופן' in name
        lesson={
            'id':lesson_id,'order':order,'titleHe':name,'titleEn':english_title(name,order),'stage':stage_num,
            'difficulty':1 if order<=23 else min(5,1+stage_num//2),'icon':['🔤','📖','🔊','🧩','⭐','🎯'][order%6],
            'color':['#6c5ce7','#00b894','#0984e3','#e17055','#fdcb6e','#e84393'][order%6],
            'learningGoal':f'ללמוד ולתרגל את הנושא: {name}.',
            'childInstruction':'מקשיבים, בוחרים, בונים מילה ומשחקים.',
            'parentExplanation':f'היחידה מתרגלת את {name} באמצעות דוגמאות קצרות, שמע ופעילויות אינטראקטיביות.',
            'rule':f'כלל הקריאה של היחידה: {name}.',
            'words':words,'activities':activity_set(lesson_id,words,full),
            'review':[{'question':f'איזו מילה כבר הכרנו?','answer':words[0]['word'],'options':[x['word'] for x in words[:4]]}],
            'commonMistakes':['בלבול בין שם האות לצליל שלה','קריאה מהירה לפני הקשבה מלאה'],
            'exceptions': 'יש מילים מיוחדות שאינן נקראות בדיוק לפי הכלל.' if 'יוצאי דופן' in name else '',
            'completionRules':{'minimumActivities':5,'minimumScore':60},
            'rewards':{'stars':3,'points':100,'sticker':f'sticker-{order:03d}','achievement':('השיעור הראשון שלי' if order==1 else f'מסיימי יחידה {order}')},
            'reviewWords':[x['id'] for x in words[:2]],
            'contentStatus':'complete' if full else 'structured'
        }
        lessons.append(lesson); ids.append(lesson_id)
    course_stages.append({'id':f'stage-{stage_num}','number':stage_num,'title':stage_title,'lessonIds':ids})

course={'version':'1.0.0','title':'אנגלית לילדים','totalLessons':94,'stages':course_stages}

sentences=[
{'id':'sentence-001','text':'My name is…','translation':'קוראים לי…','audio':'','image':'assets/images/words/placeholder.svg','focus':'name'},
{'id':'sentence-002','text':'I am…','translation':'אני…','audio':'','image':'assets/images/words/placeholder.svg','focus':'am'},
{'id':'sentence-003','text':'I like…','translation':'אני אוהב/ת…','audio':'','image':'assets/images/words/placeholder.svg','focus':'like'},
{'id':'sentence-004','text':'I have…','translation':'יש לי…','audio':'','image':'assets/images/words/placeholder.svg','focus':'have'},
{'id':'sentence-005','text':'This is…','translation':'זה / זאת…','audio':'','image':'assets/images/words/placeholder.svg','focus':'this'},
{'id':'sentence-006','text':'It is…','translation':'זה…','audio':'','image':'assets/images/words/placeholder.svg','focus':'is'},
{'id':'sentence-007','text':'I can…','translation':'אני יכול/ה…','audio':'','image':'assets/images/words/placeholder.svg','focus':'can'},
{'id':'sentence-008','text':'I see…','translation':'אני רואה…','audio':'','image':'assets/images/words/placeholder.svg','focus':'see'},
{'id':'sentence-009','text':'I want…','translation':'אני רוצה…','audio':'','image':'assets/images/words/placeholder.svg','focus':'want'},
{'id':'sentence-010','text':'How are you?','translation':'מה שלומך?','audio':'','image':'assets/images/words/placeholder.svg','focus':'how'},
{'id':'sentence-011','text':'What is your name?','translation':'איך קוראים לך?','audio':'','image':'assets/images/words/placeholder.svg','focus':'name'},
{'id':'sentence-012','text':'How old are you?','translation':'בן/בת כמה את/ה?','audio':'','image':'assets/images/words/placeholder.svg','focus':'old'},
{'id':'sentence-013','text':'What color is it?','translation':'איזה צבע זה?','audio':'','image':'assets/images/words/placeholder.svg','focus':'color'},
{'id':'sentence-014','text':'Where is the…?','translation':'איפה ה־…?','audio':'','image':'assets/images/words/placeholder.svg','focus':'where'},
{'id':'sentence-015','text':'Can you…?','translation':'האם את/ה יכול/ה…?','audio':'','image':'assets/images/words/placeholder.svg','focus':'can'},
{'id':'sentence-016','text':'Yes, I can.','translation':'כן, אני יכול/ה.','audio':'','image':'assets/images/words/placeholder.svg','focus':'yes'},
{'id':'sentence-017','text':'No, I can’t.','translation':'לא, אני לא יכול/ה.','audio':'','image':'assets/images/words/placeholder.svg','focus':'no'}]

rewards={'achievements':[
{'id':'first-lesson','title':'השיעור הראשון שלי','icon':'🌟','condition':'complete:1'},
{'id':'letter-expert','title':'מומחה אותיות','icon':'🔤','condition':'complete:10'},
{'id':'sound-champion','title':'אלוף הצלילים','icon':'🔊','condition':'stars:20'},
{'id':'beginner-reader','title':'קורא מתחיל','icon':'📖','condition':'complete:6'},
{'id':'ten-words','title':'עשר מילים חדשות','icon':'🧠','condition':'words:10'},
{'id':'three-streak','title':'שלושה שיעורים ברצף','icon':'🔥','condition':'streak:3'},
{'id':'week-streak','title':'שבוע של למידה','icon':'🏆','condition':'streak:7'},
{'id':'number-expert','title':'מומחה מספרים','icon':'🔢','condition':'stage:6'},
{'id':'sentence-builder','title':'בונה משפטים','icon':'💬','condition':'sentences:5'}],
'stickers':[{'id':f'sticker-{i:03d}','title':f'מדבקת יחידה {i}','icon':['⭐','🌈','🦄','🚀','🐳','🦋'][i%6]} for i in range(1,95)]}

settings={'music':True,'volume':0.9,'speechRate':0.85,'animations':True,'reducedMotion':False,'textSize':'medium','highContrast':False,'unlockAll':False,'autoRepeat':False,'version':'1.0.0'}

all_words=[]
seen=set()
for lesson in lessons:
    for word in lesson['words']:
        key=word['word'].lower()
        if key not in seen:
            seen.add(key); all_words.append(word)

for name,obj in [('course.json',course),('lessons.json',lessons),('words.json',all_words),('sentences.json',sentences),('rewards.json',rewards),('settings.json',settings)]:
    (ROOT/'data'/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Generated {len(lessons)} lessons and {len(all_words)} unique words')
