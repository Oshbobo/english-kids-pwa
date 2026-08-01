import { shell, audioButton, makeChoices, el } from './activity-utils.js';
export function render(activity, ctx) { const root = shell(activity); root.append(el('div',{className:'audio-control'},[audioButton(activity.audio || activity.prompt, activity.audioSrc || '')])); const { grid, feedback } = makeChoices(activity, ctx); root.append(grid, feedback); return root; }
