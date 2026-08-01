import { shell, promptNode, feedbackNode, setFeedback, el, shuffle, audioButton } from './activity-utils.js';
export function render(activity, ctx) {
  const root=shell(activity), answer=String(activity.answer||activity.prompt||''), selected=[];
  root.append(el('div',{className:'audio-control'},[audioButton(activity.audio||answer)]));
  const slots=el('div',{className:'builder-slots','aria-label':'המילה שנבנית'}), bank=el('div',{className:'letter-bank'}), feedback=feedbackNode();
  [...answer].forEach(()=>slots.append(el('div',{className:'builder-slot',text:'_'})));
  const letters=shuffle(activity.letters||[...answer]);
  letters.forEach((letter,index)=>{ const b=el('button',{className:'letter-tile',type:'button',lang:'en',dir:'ltr',text:letter,'aria-label':`האות ${letter}`}); b.addEventListener('click',()=>{ if(b.disabled||selected.length>=answer.length)return; selected.push(letter); b.disabled=true; slots.children[selected.length-1].textContent=letter; if(selected.length===answer.length){const built=selected.join('');ctx.onAttempt?.(built===answer,activity); if(built===answer){setFeedback(feedback,activity.correctFeedback||'בניתם את המילה!',true);ctx.onComplete?.({correct:true,points:activity.points||0});}else setFeedback(feedback,activity.retryFeedback||'כמעט! אפסו ונסו שוב.');}}); bank.append(b);});
  const reset=el('button',{className:'btn btn-ghost',type:'button',text:'איפוס',onclick:()=>{selected.length=0;[...slots.children].forEach(s=>s.textContent='_');[...bank.children].forEach(b=>b.disabled=false);setFeedback(feedback,'אפשר לנסות שוב 😊');}});
  root.append(promptNode(answer),slots,bank,reset,feedback); return root;
}
