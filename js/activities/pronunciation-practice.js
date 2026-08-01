import { shell, audioButton, feedbackNode, setFeedback, el } from './activity-utils.js';
import { recorderSupported, startRecording, stopRecording, cleanupRecording } from '../recorder.js';
export function render(activity, ctx) {
  const root=shell(activity), panel=el('div',{className:'record-panel'}), feedback=feedbackNode(); let audio=null, recording=false;
  panel.append(el('div',{className:'activity-prompt',lang:'en',dir:'ltr',text:activity.prompt||''}),el('div',{className:'audio-control'},[audioButton(activity.audio||activity.prompt)]));
  const status=el('div',{className:'record-status',text:recorderSupported()?'מוכנים להקלטה':'המיקרופון אינו זמין. אפשר להמשיך ללא הקלטה.'});
  const record=el('button',{className:'btn btn-primary',type:'button',text:'🎙️ התחלת הקלטה'}), stop=el('button',{className:'btn btn-ghost',type:'button',text:'⏹️ עצירה',disabled:'true'}), play=el('button',{className:'btn btn-secondary',type:'button',text:'▶️ האזנה לעצמי',disabled:'true'}), remove=el('button',{className:'btn btn-ghost',type:'button',text:'🗑️ מחיקת הקלטה',disabled:'true'}), skip=el('button',{className:'btn btn-accent',type:'button',text:'המשך ללא הקלטה'});
  if(!recorderSupported()) record.disabled=true;
  record.onclick=async()=>{try{await startRecording(result=>{audio=new Audio(result.url);play.disabled=false;remove.disabled=false;status.textContent='ההקלטה מוכנה להאזנה.';ctx.onComplete?.({correct:true,points:activity.points||0});});recording=true;record.disabled=true;stop.disabled=false;status.textContent='מקליטים…';status.classList.add('recording');}catch(error){status.textContent='לא התקבלה הרשאת מיקרופון. אפשר להמשיך ללא הקלטה.';record.disabled=true;}};
  stop.onclick=()=>{if(recording){stopRecording();recording=false;stop.disabled=true;record.disabled=false;status.classList.remove('recording');}}; play.onclick=()=>audio?.play(); remove.onclick=()=>{cleanupRecording();audio=null;play.disabled=true;remove.disabled=true;status.textContent='ההקלטה נמחקה. אפשר להקליט שוב.';}; skip.onclick=()=>{setFeedback(feedback,'אפשר להמשיך — ההקלטה היא לבחירה.',true);ctx.onComplete?.({correct:true,points:0});};
  panel.append(status,el('div',{className:'button-row'},[record,stop,play,remove,skip]),feedback);root.append(panel);return root;
}
export function cleanup(){cleanupRecording();}
