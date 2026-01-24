import { useCallback, useRef, useEffect } from 'react';

// Sound frequencies and patterns for different effects
const SOUNDS = {
  win: {
    frequencies: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6 (major chord)
    durations: [0.1, 0.1, 0.1, 0.3],
    type: 'sine' as OscillatorType,
    volume: 0.3,
  },
  purchase: {
    frequencies: [440, 554.37], // A4, C#5
    durations: [0.08, 0.12],
    type: 'sine' as OscillatorType,
    volume: 0.2,
  },
  success: {
    frequencies: [392, 493.88, 587.33, 783.99], // G4, B4, D5, G5
    durations: [0.08, 0.08, 0.08, 0.2],
    type: 'sine' as OscillatorType,
    volume: 0.25,
  },
  click: {
    frequencies: [800],
    durations: [0.03],
    type: 'square' as OscillatorType,
    volume: 0.1,
  },
  notification: {
    frequencies: [587.33, 783.99], // D5, G5
    durations: [0.1, 0.15],
    type: 'sine' as OscillatorType,
    volume: 0.2,
  },
  scratch: {
    frequencies: [200, 300, 250, 350, 280],
    durations: [0.02, 0.02, 0.02, 0.02, 0.02],
    type: 'sawtooth' as OscillatorType,
    volume: 0.05,
  },
  reveal: {
    frequencies: [261.63, 329.63, 392, 523.25], // C4, E4, G4, C5
    durations: [0.05, 0.05, 0.05, 0.15],
    type: 'triangle' as OscillatorType,
    volume: 0.2,
  },
  bigWin: {
    frequencies: [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.50],
    durations: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.4],
    type: 'sine' as OscillatorType,
    volume: 0.35,
  },
  error: {
    frequencies: [200, 150],
    durations: [0.15, 0.2],
    type: 'sawtooth' as OscillatorType,
    volume: 0.15,
  },
};

type SoundType = keyof typeof SOUNDS;

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  // Initialize audio context on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;

    try {
      const ctx = initAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const sound = SOUNDS[type];
      let startTime = ctx.currentTime;

      sound.frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = sound.type;
        oscillator.frequency.setValueAtTime(freq, startTime);

        // Apply envelope
        const duration = sound.durations[index];
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(sound.volume, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(sound.volume * 0.7, startTime + duration * 0.5);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        startTime += duration * 0.8; // Slight overlap for smoother sound
      });
    } catch (error) {
      // Silently fail - audio not supported or blocked
      console.debug('Sound playback failed:', error);
    }
  }, [initAudioContext]);

  // Convenience methods for each sound type
  const playWin = useCallback(() => playSound('win'), [playSound]);
  const playBigWin = useCallback(() => playSound('bigWin'), [playSound]);
  const playPurchase = useCallback(() => playSound('purchase'), [playSound]);
  const playSuccess = useCallback(() => playSound('success'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playNotification = useCallback(() => playSound('notification'), [playSound]);
  const playScratch = useCallback(() => playSound('scratch'), [playSound]);
  const playReveal = useCallback(() => playSound('reveal'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  const isEnabled = useCallback(() => enabledRef.current, []);

  return {
    playSound,
    playWin,
    playBigWin,
    playPurchase,
    playSuccess,
    playClick,
    playNotification,
    playScratch,
    playReveal,
    playError,
    setEnabled,
    isEnabled,
  };
}
