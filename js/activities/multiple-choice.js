import { shell, promptNode, makeChoices } from './activity-utils.js';
export function render(activity, ctx) { const root = shell(activity); root.append(promptNode(activity.prompt || '')); const { grid, feedback } = makeChoices(activity, ctx); root.append(grid, feedback); return root; }
