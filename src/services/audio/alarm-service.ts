/**
 * Alarm Sound Service
 *
 * Provides synthesized Web Audio API alarm sounds for:
 * - Focus Session Completion (timer ended)
 * - Prayer Time Arrival (Salah time)
 * - Task & Reminder Notifications
 *
 * 100% offline, zero external asset dependencies, zero network latency.
 * Handles audio context suspension and browser autoplay policies safely.
 */

export type AlarmType = "focus" | "prayer" | "reminder";

const ALARM_SOUND_STORAGE_KEY = "istiqamaah_sound_enabled_v1";

export class AlarmService {
  private audioCtx: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeTimeouts: NodeJS.Timeout[] = [];
  private soundEnabled = true;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(ALARM_SOUND_STORAGE_KEY);
        this.soundEnabled = saved !== null ? saved === "true" : true;
      } catch {
        this.soundEnabled = true;
      }
      this.initInteractionListener();
    }
  }

  /**
   * Initializes or gets the AudioContext lazily.
   */
  public getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Explicitly unlocks audio hardware on mobile browsers (Android Chrome, iOS Safari).
   * Plays a silent 1-sample buffer during a user gesture to keep the audio graph awake.
   */
  public unlockMobileAudio(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // Ignore
    }
  }

  /**
   * Attaches interaction listeners to unlock AudioContext on mobile and desktop.
   * Listens for touchstart, pointerdown, and keydown until audio is confirmed running.
   */
  private initInteractionListener() {
    if (typeof window === "undefined") return;

    const unlock = () => {
      this.unlockMobileAudio();
      if (this.audioCtx && this.audioCtx.state === "running") {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("touchend", unlock);
        window.removeEventListener("keydown", unlock);
      }
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("touchend", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ALARM_SOUND_STORAGE_KEY, String(enabled));
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Immediately stops all ongoing alarm audio.
   */
  public stopAlarm(): void {
    for (const timeout of this.activeTimeouts) {
      clearTimeout(timeout);
    }
    this.activeTimeouts = [];

    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Already stopped
      }
    }
    this.activeOscillators = [];
  }

  /**
   * Plays a single pleasant chime tone with exponential gain decay.
   */
  private playTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = "sine",
    gainValue = 0.35,
  ): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Bell-like decay envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        const idx = this.activeOscillators.indexOf(osc);
        if (idx >= 0) this.activeOscillators.splice(idx, 1);
      };
    } catch (err) {
      console.warn("Could not play synthesized tone:", err);
    }
  }

  /**
   * Focus Session Completed Alarm
   * Multi-chime ascending sequence (C5 - E5 - G5 - C6) repeated with harmonic depth.
   */
  public playFocusCompleteAlarm(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.stopAlarm();

    const now = ctx.currentTime;
    // Chime round 1
    this.playTone(523.25, now + 0.05, 0.45, "sine", 0.35); // C5
    this.playTone(659.25, now + 0.30, 0.45, "sine", 0.35); // E5
    this.playTone(783.99, now + 0.55, 0.45, "sine", 0.35); // G5
    this.playTone(1046.5, now + 0.80, 0.90, "sine", 0.40); // C6
    // Harmonic sheen
    this.playTone(2093.0, now + 0.80, 0.60, "triangle", 0.15);

    // Chime round 2 (after 1.3 seconds for a rich alarm feel)
    const t2 = setTimeout(() => {
      const later = ctx.currentTime;
      this.playTone(523.25, later + 0.05, 0.45, "sine", 0.35);
      this.playTone(659.25, later + 0.30, 0.45, "sine", 0.35);
      this.playTone(783.99, later + 0.55, 0.45, "sine", 0.35);
      this.playTone(1046.5, later + 0.80, 1.20, "sine", 0.45);
    }, 1300);

    this.activeTimeouts.push(t2);

    // Vibrate device if supported
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([250, 100, 250, 100, 400]);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Prayer Time Alarm
   * Harmonic, serene Adhan-inspired chime (E4 - G#4 - B4 - E5) with resonance.
   */
  public playPrayerAlarm(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.stopAlarm();

    const now = ctx.currentTime;
    // Reverent harmonic sequence
    this.playTone(329.63, now + 0.05, 0.8, "sine", 0.35); // E4
    this.playTone(415.30, now + 0.45, 0.8, "sine", 0.35); // G#4
    this.playTone(493.88, now + 0.85, 0.8, "sine", 0.35); // B4
    this.playTone(659.25, now + 1.25, 1.6, "sine", 0.40); // E5

    // Harmonic depth
    this.playTone(987.77, now + 1.25, 1.2, "triangle", 0.15);

    // Second flourish
    const t2 = setTimeout(() => {
      const later = ctx.currentTime;
      this.playTone(415.30, later + 0.05, 0.7, "sine", 0.30);
      this.playTone(493.88, later + 0.40, 0.7, "sine", 0.35);
      this.playTone(659.25, later + 0.75, 1.8, "sine", 0.45);
    }, 2200);

    this.activeTimeouts.push(t2);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 500]);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Task & Reminder Alarm
   * Crisp, modern dual-bell notification chime (A5 - D6).
   */
  public playReminderAlarm(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.stopAlarm();

    const now = ctx.currentTime;
    this.playTone(880.0, now + 0.02, 0.35, "sine", 0.35);  // A5
    this.playTone(1174.66, now + 0.22, 0.65, "sine", 0.40); // D6
    this.playTone(2349.32, now + 0.22, 0.40, "triangle", 0.12);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Test a sound for previewing in UI settings
   */
  public testSound(type: AlarmType = "focus"): void {
    if (type === "focus") this.playFocusCompleteAlarm();
    else if (type === "prayer") this.playPrayerAlarm();
    else if (type === "reminder") this.playReminderAlarm();
  }
}

export const alarmService = new AlarmService();
