import { Track } from '../types';

class MusicAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private synthGain: GainNode | null = null;
  private synthInterval: number | null = null;
  private isUsingSynth: boolean = false;
  private isPlaying: boolean = false;
  private volume: number = 0.8;
  private currentTrack: Track | null = null;
  private currentTime: number = 0;
  private timerInterval: number | null = null;

  // Callbacks
  private onTimeUpdateCallback?: (time: number, duration: number) => void;
  private onEndedCallback?: () => void;
  private onPlayStateChangeCallback?: (isPlaying: boolean) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';
      this.audio.volume = this.volume;

      this.audio.addEventListener('timeupdate', () => {
        if (!this.isUsingSynth && this.audio) {
          this.currentTime = this.audio.currentTime;
          const duration = isNaN(this.audio.duration) || this.audio.duration === 0 
            ? (this.currentTrack?.duration || 180) 
            : this.audio.duration;
          this.onTimeUpdateCallback?.(this.currentTime, duration);
        }
      });

      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.onPlayStateChangeCallback?.(false);
        this.onEndedCallback?.();
      });

      this.audio.addEventListener('error', () => {
        console.warn('Audio remote stream failed or blocked, activating real-time Web Audio Synth fallback.');
        this.startSynthPlayback();
      });
    }
  }

  public setCallbacks(
    onTimeUpdate?: (time: number, duration: number) => void,
    onEnded?: () => void,
    onPlayStateChange?: (isPlaying: boolean) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
    this.onPlayStateChangeCallback = onPlayStateChange;
  }

  private initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.synthGain = this.audioContext.createGain();
        this.synthGain.gain.value = this.volume * 0.25;
        this.synthGain.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public play(track: Track, startTime: number = 0) {
    this.initAudioContext();
    this.currentTrack = track;
    this.currentTime = startTime;
    this.stopSynth();

    if (track.audioUrl && this.audio) {
      this.isUsingSynth = false;
      this.audio.src = track.audioUrl;
      this.audio.currentTime = startTime;
      this.audio.volume = this.volume;

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            this.onPlayStateChangeCallback?.(true);
          })
          .catch(err => {
            console.warn('HTML5 Audio autoplay/playback issue, starting Web Audio synth:', err);
            this.startSynthPlayback();
          });
      }
    } else {
      this.startSynthPlayback();
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.audio && !this.isUsingSynth) {
      this.audio.pause();
    }
    this.stopSynth();
    this.onPlayStateChangeCallback?.(false);
  }

  public resume() {
    if (!this.currentTrack) return;
    this.initAudioContext();

    if (!this.isUsingSynth && this.audio && this.audio.src) {
      this.audio.volume = this.volume;
      this.audio.play()
        .then(() => {
          this.isPlaying = true;
          this.onPlayStateChangeCallback?.(true);
        })
        .catch(() => {
          this.startSynthPlayback();
        });
    } else {
      this.startSynthPlayback();
    }
  }

  public seek(seconds: number) {
    this.currentTime = seconds;
    if (!this.isUsingSynth && this.audio) {
      this.audio.currentTime = seconds;
    }
    const duration = this.currentTrack?.duration || 180;
    this.onTimeUpdateCallback?.(seconds, duration);
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    if (this.synthGain) {
      this.synthGain.gain.value = this.volume * 0.25;
    }
  }

  private startSynthPlayback() {
    this.isUsingSynth = true;
    this.isPlaying = true;
    this.initAudioContext();
    this.onPlayStateChangeCallback?.(true);

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.synthInterval) clearInterval(this.synthInterval);

    // Chords and melodic progression based on track style
    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33]; // C Major
    let step = 0;

    const playTone = (freq: number, type: OscillatorType = 'sine', duration: number = 0.3) => {
      if (!this.audioContext || !this.synthGain) return;
      try {
        const osc = this.audioContext.createOscillator();
        const noteGain = this.audioContext.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

        noteGain.gain.setValueAtTime(0.01, this.audioContext.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.15 * this.volume, this.audioContext.currentTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        osc.connect(noteGain);
        noteGain.connect(this.synthGain);
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
      } catch (e) {
        // Safe fail
      }
    };

    const synthType: OscillatorType = 
      this.currentTrack?.synthStyle === 'chiptune' ? 'square' :
      this.currentTrack?.synthStyle === 'electro' ? 'sawtooth' :
      this.currentTrack?.synthStyle === 'indie_rock' ? 'triangle' : 'sine';

    this.synthInterval = window.setInterval(() => {
      if (!this.isPlaying) return;
      const note = scale[step % scale.length];
      const bassNote = scale[(step * 2) % 4] / 2;
      
      playTone(note, synthType, 0.25);
      if (step % 2 === 0) {
        playTone(bassNote, 'triangle', 0.4);
      }
      step++;
    }, 320);

    // Local ticker
    this.timerInterval = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.currentTime += 0.5;
      const duration = this.currentTrack?.duration || 180;
      this.onTimeUpdateCallback?.(this.currentTime, duration);

      if (this.currentTime >= duration) {
        this.stopSynth();
        this.isPlaying = false;
        this.onPlayStateChangeCallback?.(false);
        this.onEndedCallback?.();
      }
    }, 500);
  }

  private stopSynth() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);
      return dataArray;
    }
    return new Uint8Array(16);
  }
}

export const musicAudioEngine = new MusicAudioEngine();
