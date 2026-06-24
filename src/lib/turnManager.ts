export interface Team {
  id: number;
  name: string;
  avatar: string;
  members: string[];
  colorClass: string;
  hexColor: string;
  correctAnswers?: number;
  incorrectAnswers?: number;
}

export type EstadoTurno = 'ESPERANDO' | 'EN_CURSO' | 'RESUELTO';

export interface TurnInfo {
  equipo: Team;
  miembro: string;
  estado: EstadoTurno;
  ronda: number;
}

export class TurnManager {
  private equipos: Team[];
  private indiceEquipoActual: number;
  private indicesMiembros: number[];
  private ronda: number;
  private estado: EstadoTurno;

  constructor() {
    this.equipos = [];
    this.indiceEquipoActual = 0;
    this.indicesMiembros = [];
    this.ronda = 1;
    this.estado = 'ESPERANDO';
  }

  /**
   * Inicializa el gestor leyendo la configuración desde localStorage.
   * Si no hay configuración o faltan datos, arrojará un error.
   */
  public inicializar(): void {
    if (typeof window === 'undefined') {
      throw new Error("TurnManager debe ser inicializado en el cliente (navegador).");
    }

    const savedData = localStorage.getItem('serpientes_escaleras_setup');
    if (!savedData) {
      throw new Error("No se encontró la configuración del juego en localStorage.");
    }

    try {
      const parsed = JSON.parse(savedData);
      if (!parsed.teams || !Array.isArray(parsed.teams) || parsed.teams.length < 2) {
        throw new Error("La configuración de equipos no es válida o hay menos de 2 equipos.");
      }

      this.equipos = parsed.teams.map((t: Team) => ({
        ...t,
        correctAnswers: t.correctAnswers || 0,
        incorrectAnswers: t.incorrectAnswers || 0
      }));
      this.indiceEquipoActual = 0;
      this.ronda = 1;
      this.estado = 'ESPERANDO';

      // Iniciar cada equipo con el primer integrante (índice 0)
      this.indicesMiembros = this.equipos.map(() => 0);

    } catch (error) {
      console.error("Error al parsear configuración:", error);
      throw error;
    }
  }

  /**
   * Devuelve quién tiene el turno actualmente.
   */
  public obtenerTurnoActual(): TurnInfo {
    if (this.equipos.length === 0) {
      throw new Error("TurnManager no ha sido inicializado correctamente.");
    }

    const equipoActivo = this.equipos[this.indiceEquipoActual];
    const indiceMiembroActivo = this.indicesMiembros[this.indiceEquipoActual];
    const miembroActivo = equipoActivo.members[indiceMiembroActivo];

    return {
      equipo: equipoActivo,
      miembro: miembroActivo,
      estado: this.estado,
      ronda: this.ronda
    };
  }

  /**
   * Pasa el estado del turno a EN_CURSO.
   * Debe llamarse cuando el jugador realiza su acción (ej. tirar dado).
   */
  public comenzarTurno(): void {
    if (this.estado !== 'ESPERANDO') {
      throw new Error(`No se puede comenzar el turno. Estado actual: ${this.estado}`);
    }
    this.estado = 'EN_CURSO';
  }

  /**
   * Pasa el estado del turno a RESUELTO e incluye el resultado.
   * @param resultado Cualquier dato que represente el resultado del turno (ej. acierto/fallo, nueva posicion).
   */
  public resolverTurno(resultado: any): TurnInfo & { resultado: any } {
    if (this.estado !== 'EN_CURSO') {
      throw new Error(`No se puede resolver el turno. Estado actual: ${this.estado}`);
    }
    this.estado = 'RESUELTO';

    // Registrar estadísticas
    const equipo = this.equipos[this.indiceEquipoActual];
    if (resultado && typeof resultado.fueCorrecto === 'boolean') {
      if (resultado.fueCorrecto) {
        equipo.correctAnswers = (equipo.correctAnswers || 0) + 1;
      } else {
        equipo.incorrectAnswers = (equipo.incorrectAnswers || 0) + 1;
      }
      this.persistirEquipos();
    }

    return {
      ...this.obtenerTurnoActual(),
      resultado
    };
  }

  private persistirEquipos(): void {
    const savedData = localStorage.getItem('serpientes_escaleras_setup');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        parsed.teams = this.equipos;
        localStorage.setItem('serpientes_escaleras_setup', JSON.stringify(parsed));
      } catch (e) {
        console.error("Error al persistir equipos:", e);
      }
    }
  }

  /**
   * Finaliza el turno actual y hace la doble rotación:
   * 1. Avanza al siguiente integrante del equipo actual.
   * 2. Pasa el turno al siguiente equipo.
   */
  public siguienteTurno(): TurnInfo {
    if (this.estado !== 'RESUELTO') {
      throw new Error(`No se puede avanzar de turno. El turno actual no ha sido resuelto.`);
    }

    const equipoActivo = this.equipos[this.indiceEquipoActual];
    
    // 1. Avanzar al siguiente integrante del equipo actual
    const cantMiembros = equipoActivo.members.length;
    if (cantMiembros > 0) {
      this.indicesMiembros[this.indiceEquipoActual] = (this.indicesMiembros[this.indiceEquipoActual] + 1) % cantMiembros;
    }

    // 2. Avanzar al siguiente equipo
    this.indiceEquipoActual = (this.indiceEquipoActual + 1) % this.equipos.length;

    // Si dimos la vuelta completa a todos los equipos, sumamos una ronda
    if (this.indiceEquipoActual === 0) {
      this.ronda++;
    }

    // Restablecer estado para el nuevo turno
    this.estado = 'ESPERANDO';

    return this.obtenerTurnoActual();
  }

  /**
   * Permite inyectar equipos directamente sin localStorage (útil para testing o mockups)
   */
  public cargarEquiposManualmente(equipos: Team[]): void {
    if (equipos.length < 2) {
      throw new Error("Se requieren al menos 2 equipos.");
    }
    this.equipos = equipos;
    this.indiceEquipoActual = 0;
    this.ronda = 1;
    this.estado = 'ESPERANDO';
    this.indicesMiembros = this.equipos.map(() => 0);
  }
}

// Exportamos una instancia única (Singleton) por defecto para que todo el cliente 
// pueda acceder al mismo estado del gestor.
export const turnManager = new TurnManager();
