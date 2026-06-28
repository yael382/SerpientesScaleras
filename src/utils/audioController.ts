// src/utils/audioController.ts

export type SoundEffect = 
  | 'correcto' 
  | 'incorrecto' 
  | 'ruleta' 
  | 'victoria' 
  | 'click'
  | 'reloj_normal'
  | 'poco_tiempo'
  | 'fin_tiempo'
  | 'a_jugar'
  | 'despues_ruleta';

class AudioController {
  private static instance: AudioController;
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;
  private currentTimerSound: SoundEffect | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.sounds.set('correcto', new Audio('/sounds/Ganar.mp3'));
      this.sounds.set('incorrecto', new Audio('/sounds/perder.mp3'));
      this.sounds.set('ruleta', new Audio('/sounds/ruleta.mp3'));
      this.sounds.set('victoria', new Audio('/sounds/victoria.mp3'));
      this.sounds.set('click', new Audio('/sounds/click.mp3'));
      this.sounds.set('reloj_normal', new Audio('/sounds/reloj-normal.mp3'));
      this.sounds.set('poco_tiempo', new Audio('/sounds/poco-tiempo.mp3'));
      this.sounds.set('fin_tiempo', new Audio('/sounds/fin-tiempo.mp3'));
      this.sounds.set('a_jugar', new Audio('/sounds/a-jugar.mp3'));
      this.sounds.set('despues_ruleta', new Audio('/sounds/despues-ruleta.mp3'));
    }
  }

  public static getInstance(): AudioController {
    if (!AudioController.instance) {
      AudioController.instance = new AudioController();
    }
    return AudioController.instance;
  }

  public play(effect: SoundEffect, loop: boolean = false) {
    if (this.isMuted) return;

    const audio = this.sounds.get(effect);
    if (audio) {
      audio.currentTime = 0;
      audio.loop = loop;
      audio.play().catch(err => console.log("Error al reproducir audio:", err));
    }
  }

  public playUntilEnded(effect: SoundEffect, maxWaitMs: number = 3500): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMuted) {
        resolve();
        return;
      }
      const audio = this.sounds.get(effect);
      if (!audio) {
        resolve();
        return;
      }
      audio.currentTime = 0;
      audio.loop = false;

      let resolved = false;
      const finish = () => {
        if (!resolved) {
          resolved = true;
          audio.removeEventListener('ended', finish);
          resolve();
        }
      };

      audio.addEventListener('ended', finish);
      setTimeout(finish, maxWaitMs);

      audio.play().catch(err => {
        console.log("Error al reproducir audio:", err);
        finish();
      });
    });
  }

  public playTimerLoop(type: 'normal' | 'warning') {
    if (this.isMuted) return;
    const targetEffect: SoundEffect = type === 'normal' ? 'reloj_normal' : 'poco_tiempo';

    if (this.currentTimerSound === targetEffect) return;

    this.stopTimerSounds();
    this.currentTimerSound = targetEffect;
    this.play(targetEffect, true);
  }

  public stopTimerSounds() {
    if (this.currentTimerSound) {
      const audio = this.sounds.get(this.currentTimerSound);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      this.currentTimerSound = null;
    }
  }

  public playTimerEnd() {
    this.stopTimerSounds();
    this.play('fin_tiempo', false);
  }

  public stop(effect: SoundEffect) {
    const audio = this.sounds.get(effect);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (this.currentTimerSound === effect) {
      this.currentTimerSound = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.sounds.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      this.currentTimerSound = null;
    }
    return this.isMuted;
  }

  public getMutedStatus(): boolean {
    return this.isMuted;
  }
}

export const audioController = AudioController.getInstance();