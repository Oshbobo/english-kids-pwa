import * as multipleChoice from './activities/multiple-choice.js';
import * as imageMatch from './activities/image-match.js';
import * as audioMatch from './activities/audio-match.js';
import * as letterOrder from './activities/letter-order.js';
import * as wordBuilder from './activities/word-builder.js';
import * as memoryGame from './activities/memory-game.js';
import * as sortingGame from './activities/sorting-game.js';
import * as missingLetter from './activities/missing-letter.js';
import * as sentenceBuilder from './activities/sentence-builder.js';
import * as pronunciation from './activities/pronunciation-practice.js';
import * as bingo from './activities/bingo.js';

const renderers = {
  'multiple-choice': multipleChoice, 'letter-choice': audioMatch, 'image-choice': imageMatch,
  'word-heard': audioMatch, 'image-match': imageMatch, 'word-image-match': imageMatch,
  'audio-match': audioMatch, 'case-match': multipleChoice, 'letter-order': letterOrder,
  'word-builder': wordBuilder, 'missing-letter': missingLetter, 'missing-pattern': missingLetter,
  'sorting-game': sortingGame, 'memory-game': memoryGame, 'true-false': multipleChoice,
  'listening-game': audioMatch, 'initial-sound': audioMatch, 'final-sound': audioMatch,
  'sentence-builder': sentenceBuilder, 'sentence-completion': multipleChoice,
  'bingo': bingo, 'pronunciation-practice': pronunciation
};
let activeModule = null;
export function renderActivity(activity, context) {
  activeModule?.cleanup?.();
  activeModule = renderers[activity.type] || multipleChoice;
  return activeModule.render(activity, context);
}
export function cleanupActivity() { activeModule?.cleanup?.(); activeModule = null; }
