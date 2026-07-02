export const ALARM_TONES = {
  emergency: 'https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3',
  siren: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  beep: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3'
};

export const playAlarmSound = (toneUrl) => {
  const audio = new Audio(toneUrl || ALARM_TONES.emergency);
  audio.loop = true;
  audio.volume = 1.0;
  audio.play().catch(e => console.error("Audio play failed:", e));
  return audio;
};
