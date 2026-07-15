export const ALARM_TONES = {
  emergency: 'https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3',
  siren: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  beep: 'https://assets.mixkit.co/active_storage/sfx/1000/1000-preview.mp3'
};

let audioInstance = null;
let synthInterval = null;
let audioCtx = null;

// Synthetic alarm sound generator (extremely loud and works offline)
const startSynthAlarm = () => {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let toggle = true;
    
    synthInterval = setInterval(() => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      // High pitch alternating digital clock sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(toggle ? 880 : 1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      toggle = !toggle;
    }, 200);
  } catch (e) {
    console.error("Synth alarm failed:", e);
  }
};

const stopSynthAlarm = () => {
  if (synthInterval) {
    clearInterval(synthInterval);
    synthInterval = null;
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
};

export const playAlarmSound = (toneUrl) => {
  // Stop any existing alarms
  stopAlarm();

  // Try playing audio file
  audioInstance = new Audio(toneUrl || ALARM_TONES.emergency);
  audioInstance.loop = true;
  audioInstance.volume = 1.0;
  
  audioInstance.play().catch(e => {
    console.warn("Audio file blocked/failed, starting synthetic alarm:", e);
    startSynthAlarm();
  });

  // Also play the synthetic alarm concurrently for maximum loudness and offline guarantee
  startSynthAlarm();

  return {
    pause: () => {
      stopAlarm();
    }
  };
};

export const stopAlarm = () => {
  if (audioInstance) {
    audioInstance.pause();
    audioInstance = null;
  }
  stopSynthAlarm();
};
