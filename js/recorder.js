let stream = null, recorder = null, chunks = [], blobUrl = null;
export function recorderSupported() { return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder); }
export async function startRecording(onData) {
  if (!recorderSupported()) throw new Error('הקלטה אינה נתמכת בדפדפן זה.');
  cleanupRecording();
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = []; recorder = new MediaRecorder(stream);
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
    blobUrl = URL.createObjectURL(blob); onData?.({ blob, url: blobUrl });
    stream?.getTracks().forEach(track => track.stop()); stream = null;
  };
  recorder.start(); return recorder;
}
export function stopRecording() { if (recorder?.state === 'recording') recorder.stop(); }
export function cleanupRecording() {
  if (recorder?.state === 'recording') recorder.stop();
  stream?.getTracks().forEach(track => track.stop()); stream = null; recorder = null; chunks = [];
  if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = null;
}
