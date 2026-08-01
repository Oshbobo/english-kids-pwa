import { shell, feedbackNode, setFeedback, el, shuffle } from './activity-utils.js';
export function render(activity, ctx) {
  const root=shell(activity), feedback=feedbackNode(); let first=null, lock=false, matched=0;
  const cards=shuffle((activity.pairs||[]).flatMap((pair,index)=>pair.map(value=>({value,pair:index}))));
  const grid=el('div',{className:'memory-grid'});
  cards.forEach(card=>{ const button=el('button',{className:'memory-card',type:'button',text:'❓','aria-label':'קלף זיכרון'}); button.dataset.pair=card.pair; button.dataset.value=card.value;
    button.addEventListener('click',()=>{if(lock||button.classList.contains('matched')||button===first)return;button.textContent=card.value;button.classList.add('revealed');if(!first){first=button;return;}lock=true;const ok=first.dataset.pair===button.dataset.pair;ctx.onAttempt?.(ok,activity);if(ok){first.classList.add('matched');button.classList.add('matched');matched+=2;setFeedback(feedback,activity.correctFeedback||'מצאתם זוג!',true);first=null;lock=false;if(matched===cards.length)ctx.onComplete?.({correct:true,points:activity.points||0});}else{setFeedback(feedback,activity.retryFeedback||'המשיכו לחפש.');setTimeout(()=>{first.textContent='❓';button.textContent='❓';first.classList.remove('revealed');button.classList.remove('revealed');first=null;lock=false;},650);}});grid.append(button);});
  root.append(grid,feedback);return root;
}
