// src/lib/gameEngine.ts
import confetti from 'canvas-confetti';
import { turnManager } from './turnManager';
import { ChallengePool } from '../utils/fracGeo';
import { generateMathQuestion } from '../utils/mathgenerator';
import { audioController } from '../utils/audioController';

export interface GameEngineConfig {
  level: 'Alpha' | 'Beta';
  defaultTimeLimit: number;
}

export class GameEngine {
  private config: GameEngineConfig;
  private challengePool: ChallengePool;
  private isAnswering: boolean = false;
  private gameStarted: boolean = false;
  private challengeTimer: ReturnType<typeof setInterval> | undefined;
  private currentDuration: number = 60;
  private currentRemainingTime: number = 60;
  private currentPendingDuration: number = 0;

  private questionEl: HTMLElement | null = null;
  private optionsContainer: HTMLElement | null = null;
  private feedbackEl: HTMLElement | null = null;
  private timerBox: HTMLElement | null = null;
  private timeLeftEl: HTMLElement | null = null;
  private nextBtn: HTMLElement | null = null;

  constructor(config: GameEngineConfig) {
    this.config = config;
    this.challengePool = new ChallengePool(config.level === 'Alpha' ? '5to' : '6to', 2);
    this.currentDuration = config.defaultTimeLimit;
  }

  public init() {
    this.questionEl = document.getElementById('math-question');
    this.optionsContainer = document.getElementById('options-container');
    this.feedbackEl = document.getElementById('feedback-message');
    this.timerBox = document.getElementById('timer-box');
    this.timeLeftEl = document.getElementById('time-left');
    this.nextBtn = document.getElementById('btn-next-question');

    const rulesModal = document.getElementById('rules-modal');
    if (!rulesModal || rulesModal.style.display === 'none' || rulesModal.classList.contains('modal-fade-out')) {
      this.gameStarted = true;
    } else {
      this.gameStarted = false;
    }

    try {
      turnManager.inicializar();
      this.updateTurnUI();
    } catch (e) {
      console.warn("Redirigiendo a Setup por falta de datos...");
      window.location.href = '/Setup';
      return;
    }

    this.setupEventListeners();
    this.generateQuestion();
  }

  private setupEventListeners() {
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        audioController.play('click');
        this.advanceToNextTurn();
      });
    }

    const muteBtn = document.getElementById('mute-button');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = audioController.toggleMute();
        muteBtn.textContent = isMuted ? '🔇 Silencio' : '🔊 Sonido';
        muteBtn.classList.toggle('estado-silenciado', isMuted);
      });
    }

    document.addEventListener('modalCerrado', () => {
      this.gameStarted = true;
      audioController.play('click');
      if (this.currentPendingDuration > 0) {
        this.startTimer(this.currentPendingDuration);
      }
    });

    document.addEventListener('retrocesoCompletado', () => {
      this.showNextButton();
    });

    document.addEventListener('siguienteTurno', () => {
      this.showNextButton();
    });

    document.addEventListener('avanzarFicha', (e: any) => {
      const pasos = e.detail.pasos;
      try {
        const datosTurno = turnManager.obtenerTurnoActual();
        const equipoActivo = datosTurno.equipo;

        document.dispatchEvent(new CustomEvent('renderizarMovimientoTablero', {
          detail: {
            equipoName: equipoActivo.name,
            equipoAvatar: equipoActivo.avatar,
            pasos: pasos
          }
        }));
      } catch (err) {
        console.error("Error enviando datos del turno al tablero:", err);
      }
    });
  }

  public updateTurnUI() {
    try {
      const turnInfo = turnManager.obtenerTurnoActual();
      const indicator = document.getElementById('turn-indicator');
      const avatarEl = document.getElementById('turn-avatar');
      const teamEl = document.getElementById('turn-team');
      const memberEl = document.getElementById('turn-member');

      if (indicator && avatarEl && teamEl && memberEl) {
        indicator.classList.remove('hidden');
        avatarEl.textContent = turnInfo.equipo.avatar;
        teamEl.textContent = turnInfo.equipo.name;
        teamEl.style.color = turnInfo.equipo.hexColor;
        memberEl.textContent = turnInfo.miembro;
        indicator.style.borderColor = turnInfo.equipo.hexColor;
        indicator.style.boxShadow = `0 8px 32px ${turnInfo.equipo.hexColor}40`;
      }
    } catch (e) {
      console.error("Error al actualizar UI de turno:", e);
    }
  }

  private prepareOrStartTimer(duration: number) {
    this.stopTimer();
    this.currentPendingDuration = duration;
    this.currentDuration = duration;
    this.currentRemainingTime = duration;

    if (this.timeLeftEl) this.timeLeftEl.textContent = String(this.currentRemainingTime);
    if (this.timerBox) this.timerBox.classList.remove('hidden', 'timer-warning');

    if (this.gameStarted) {
      this.startTimer(duration);
    }
  }

  private startTimer(duration: number) {
    if (this.challengeTimer) clearInterval(this.challengeTimer);
    this.currentDuration = duration;
    this.currentRemainingTime = duration;

    if (this.timeLeftEl) this.timeLeftEl.textContent = String(this.currentRemainingTime);
    if (this.timerBox) this.timerBox.classList.remove('hidden', 'timer-warning');

    audioController.playTimerLoop('normal');

    this.challengeTimer = setInterval(() => {
      this.currentRemainingTime--;
      if (this.timeLeftEl) this.timeLeftEl.textContent = String(this.currentRemainingTime);
      
      if (this.currentRemainingTime <= 10) {
        if (this.timerBox) this.timerBox.classList.add('timer-warning');
        audioController.playTimerLoop('warning');
      }

      if (this.currentRemainingTime <= 0) {
        this.stopTimer();
        this.handleTimeout();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.challengeTimer) {
      clearInterval(this.challengeTimer);
      this.challengeTimer = undefined;
    }
    audioController.stopTimerSounds();
    if (this.timerBox) this.timerBox.classList.add('hidden');
  }

  private handleTimeout() {
    if (this.isAnswering) return;
    this.isAnswering = true;

    audioController.playTimerEnd();
    this.disableOptions();

    if (this.feedbackEl) {
      this.feedbackEl.innerHTML = `
        <div class="kahoot-feedback incorrect">
          <h2 class="kahoot-title">⏰ ¡TIEMPO AGOTADO! ✖</h2>
          <p class="kahoot-subtitle">No te preocupes, ¡gira la ruleta del destino!</p>
        </div>
      `;
    }

    setTimeout(() => {
      try {
        turnManager.comenzarTurno();
        turnManager.resolverTurno({ fueCorrecto: false });
      } catch (e) { console.error(e); }
      
      document.dispatchEvent(new CustomEvent('abrirRuletaRetroceso'));
    }, 1500);
  }

  public generateQuestion() {
    this.isAnswering = false;
    if (this.feedbackEl) {
      this.feedbackEl.innerHTML = "";
      this.feedbackEl.className = "feedback";
    }
    if (this.nextBtn) this.nextBtn.classList.add('hidden');
    if (this.optionsContainer) this.optionsContainer.style.display = 'flex';

    const useChallenge = Math.random() > 0.5;

    if (useChallenge) {
      const challenge = this.challengePool.next();
      if (this.questionEl) {
        this.questionEl.innerHTML = challenge.htmlQuestion;
        this.questionEl.style.fontSize = '';
        this.questionEl.style.letterSpacing = '';
      }
      this.prepareOrStartTimer(challenge.timeLimit || this.config.defaultTimeLimit);
      this.renderOptions(challenge.options);
    } else {
      const question = generateMathQuestion(this.config.level);
      if (this.questionEl) {
        this.questionEl.textContent = question.text;
        this.questionEl.style.fontSize = this.config.level === 'Alpha' ? '3.8rem' : '3.2rem';
        this.questionEl.style.letterSpacing = '4px';
      }
      if (this.config.level === 'Beta') {
        this.prepareOrStartTimer(15);
      } else {
        this.stopTimer();
        this.currentPendingDuration = 0;
      }
      this.renderOptions(question.options);
    }
  }

  private renderOptions(options: { value: number; isCorrect: boolean }[]) {
    if (!this.optionsContainer) return;
    this.optionsContainer.innerHTML = '';

    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const colorClasses = ['blue-card', 'green-card', 'red-card', 'yellow-card'];

    options.forEach((opt, index) => {
      const btn = document.createElement('button');
      btn.className = `fruit-btn ${colorClasses[index % colorClasses.length]}`;
      const label = labels[index] || `Opción ${index + 1}`;
      btn.textContent = `Opción ${label}: ${opt.value}`;

      btn.addEventListener('click', () => {
        if (!this.isAnswering) {
          audioController.play('click');
          this.checkAnswer(opt.isCorrect);
        }
      });

      this.optionsContainer!.appendChild(btn);
    });
  }

  private disableOptions() {
    if (!this.optionsContainer) return;
    const buttons = this.optionsContainer.querySelectorAll<HTMLButtonElement>('.fruit-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
  }

  private checkAnswer(isCorrect: boolean) {
    if (!this.feedbackEl || !this.optionsContainer || this.isAnswering) return;
    this.isAnswering = true;
    this.stopTimer();
    this.disableOptions();

    try {
      turnManager.comenzarTurno();
      turnManager.resolverTurno({ fueCorrecto: isCorrect });
    } catch (e) { console.error(e); }

    if (isCorrect) {
      audioController.play('correcto');
      confetti({ particleCount: 280, spread: 180, origin: { y: 0.6 } });

      this.feedbackEl.innerHTML = `
        <div class="kahoot-feedback correct">
          <h2 class="kahoot-title">✔ ¡RESPUESTA CORRECTA! 🎉</h2>
          <p class="kahoot-subtitle">¡Excelente trabajo matemático! Gira la ruleta para avanzar.</p>
        </div>
      `;

      if (this.optionsContainer) this.optionsContainer.style.display = 'none';
      document.dispatchEvent(new CustomEvent('respuestaCorrecta'));

    } else {
      audioController.play('incorrecto');
      if (this.optionsContainer) this.optionsContainer.style.display = 'none';

      this.feedbackEl.innerHTML = `
        <div class="kahoot-feedback incorrect">
          <h2 class="kahoot-title">✖ ¡INCORRECTO! 😅</h2>
          <p class="kahoot-subtitle">¡Sigue intentándolo en el próximo turno! Prepara la ruleta.</p>
        </div>
      `;

      document.dispatchEvent(new CustomEvent('abrirRuletaRetroceso'));
      this.triggerFallingCrosses();
    }
  }

  private triggerFallingCrosses() {
    for (let i = 0; i < 20; i++) {
      const cross = document.createElement('div');
      cross.textContent = '❌';
      cross.style.position = 'fixed';
      cross.style.top = '-60px';
      cross.style.left = Math.random() * 100 + 'vw';
      cross.style.fontSize = Math.random() * (60 - 35) + 35 + 'px';
      cross.style.zIndex = '9999';
      cross.style.pointerEvents = 'none';
      cross.style.transition = 'transform 2.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 2.5s ease';

      document.body.appendChild(cross);

      setTimeout(() => {
        cross.style.transform = `translateY(115vh) rotate(${Math.random() * 720 - 360}deg)`;
        cross.style.opacity = '0';
        setTimeout(() => cross.remove(), 2500);
      }, Math.random() * 500);
    }
  }

  private showNextButton() {
    if (this.nextBtn) {
      this.nextBtn.classList.remove('hidden');
    }
  }

  private advanceToNextTurn() {
    try {
      turnManager.siguienteTurno();
      this.updateTurnUI();
    } catch (e) { console.error(e); }

    this.generateQuestion();
  }
}
