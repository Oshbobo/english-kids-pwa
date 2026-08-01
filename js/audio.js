import { speak } from './speech.js';
let activeAudio = null;
export async function playAudio({ src = '', text = '', slow = false } = {}) {
  stopAudio();
  if (src) {
    try {
      activeAudio = new Audio(src); activeAudio.playbackRate = slow ? .72 : 1;
      await activeAudio.play(); return;
    } catch { activeAudio = null; }
  }
  if (text) return speak(text, { slow });
  throw new Error('אין קובץ שמע או טקסט להשמעה.');
}
export function stopAudio() { if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; } }
