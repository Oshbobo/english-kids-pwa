import { loadSettings } from './storage.js';
let activeUtterance = null;
export function canSpeak() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }
export function stopSpeech() { if (canSpeak()) speechSynthesis.cancel(); activeUtterance = null; }
export function speak(text, options = {}) {
  if (!canSpeak()) return Promise.reject(new Error('הדפדפן אינו תומך בהשמעת טקסט.'));
  stopSpeech();
  const settings = loadSettings({ volume: .9, speechRate: .85 });
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = options.lang || 'en-US'; utterance.rate = options.slow ? .62 : Number(options.rate || settings.speechRate || .85); utterance.volume = Number(settings.volume ?? .9);
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => /^en(-|_)/i.test(v.lang) && /female|samantha|zira|google/i.test(v.name)) || voices.find(v => /^en/i.test(v.lang));
  if (voice) utterance.voice = voice;
  activeUtterance = utterance;
  return new Promise((resolve, reject) => { utterance.onend = resolve; utterance.onerror = () => reject(new Error('לא ניתן להשמיע כעת.')); speechSynthesis.speak(utterance); });
}
