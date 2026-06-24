// src/utils/audioController.ts

// Definimos los nombres de los sonidos para evitar errores de escritura
export type SoundEffect = 'correcto' | 'incorrecto' | 'ruleta' | 'victoria';

class AudioController {
  private static instance: AudioController;
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;

  private constructor() {
    // Inicializamos y precargamos los audios apuntando a la carpeta public
    if (typeof window !== 'undefined') {
      this.sounds.set('correcto', new Audio('sounds/Ganar.mp3')); // Ajusta el nombre si es necesario
      this.sounds.set('incorrecto', new Audio('sounds/perder.mp3'));
      this.sounds.set('ruleta', new Audio('sounds/ruleta.mp3'));
      this.sounds.set('victoria', new Audio('sounds/victoria.mp3'));
      
      // Agrega aquí los archivos para escalera y serpiente cuando los tengas:
      // this.sounds.set('escalera', new Audio('sounds/Escalera.mp3'));
      // this.sounds.set('serpiente', new Audio('sounds/Serpiente.mp3'));
    }
  }

  // Obtener la instancia única global
  public static getInstance(): AudioController {
    if (!AudioController.instance) {
      AudioController.instance = new AudioController();
    }
    return AudioController.instance;
  }

  // Reproducir un sonido
  public play(effect: SoundEffect, loop: boolean = false) {
    if (this.isMuted) return;

    const audio = this.sounds.get(effect);
    if (audio) {
      audio.currentTime = 0; // Reinicia el audio por si se presiona muy rápido
      audio.loop = loop;
      audio.play().catch(err => console.log("Error al reproducir audio:", err));
    }
  }

  // Detener un sonido específico (útil para la ruleta o bucles)
  public stop(effect: SoundEffect) {
    const audio = this.sounds.get(effect);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  // Alternar el estado de silencio global
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    // Si se silencia, detenemos inmediatamente cualquier sonido que esté sonando
    if (this.isMuted) {
      this.sounds.forEach(audio => audio.pause());
    }
    
    return this.isMuted;
  }

  // Saber si actualmente está silenciado
  public getMutedStatus(): boolean {
    return this.isMuted;
  }
}

// Exportamos la instancia única para usarla en todo el proyecto
export const audioController = AudioController.getInstance();