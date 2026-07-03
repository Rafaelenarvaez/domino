import { Injectable } from '@angular/core';

export interface MesaJugadores {
  jugador1A: string; // Equipo 1
  jugador2A: string; // Equipo 1
  jugador1B: string; // Equipo 2
  jugador2B: string; // Equipo 2
}

export interface Mesa {
  id: number;
  jugadores: MesaJugadores;
  puntosParaGanar: number;
  esTorneo?: boolean;
  idsTorneo?: {
    eq1: string[];
    eq2: string[];
  };
  resultadoRegistrado?: boolean;
}

export interface CronometroConfig {
  habilitado: boolean;
  minutos: number; // 30 o 60
}

/**
 * Estado persistido del timer por mesa.
 * Usa timestamps para que el cronómetro siga corriendo aunque
 * el usuario navegue entre pantallas.
 */
export interface TimerState {
  startedAt: number | null;    // timestamp (ms) cuando se inició/reanudó
  elapsedBeforePause: number;  // segundos acumulados antes de pausar
  running: boolean;
  finished: boolean;
  totalSeconds: number;        // duración total (ej. 1800 o 3600)
}

export interface PlayerStats {
  nombre: string;
  juegosJugados: number;
  partidasGanadas: number;
  partidasPerdidas: number;
  puntosObtenidos: number;
}

@Injectable({
  providedIn: 'root',
})
export class PartidaLocalService {

  private mesasCache: Mesa[] = [];

  setMesas(mesas: Mesa[]) {
    this.mesasCache = mesas;
    localStorage.setItem('mesas', JSON.stringify(mesas));
  }

  getMesas(): Mesa[] {
    if (this.mesasCache.length) {
      return this.mesasCache;
    }

    const saved = localStorage.getItem('mesas');
    this.mesasCache = saved ? JSON.parse(saved) : [];
    return this.mesasCache;
  }

  getMesa(id: number): Mesa | undefined {
    const mesas = this.getMesas();
    return mesas.find(m => m.id === id);
  }

  setCronometroConfig(config: CronometroConfig) {
    localStorage.setItem('cronometro_config', JSON.stringify(config));
  }

  getCronometroConfig(): CronometroConfig {
    const saved = localStorage.getItem('cronometro_config');
    return saved ? JSON.parse(saved) : { habilitado: false, minutos: 30 };
  }

  // ─── Timer por mesa ───

  private timerKey(mesaId: number): string {
    return `cronometro_mesa_${mesaId}`;
  }

  getTimerState(mesaId: number): TimerState | null {
    const saved = localStorage.getItem(this.timerKey(mesaId));
    return saved ? JSON.parse(saved) : null;
  }

  private saveTimerState(mesaId: number, state: TimerState) {
    localStorage.setItem(this.timerKey(mesaId), JSON.stringify(state));
  }

  initTimer(mesaId: number, totalSeconds: number) {
    // Solo inicializar si no existe aún
    if (!this.getTimerState(mesaId)) {
      const state: TimerState = {
        startedAt: null,
        elapsedBeforePause: 0,
        running: false,
        finished: false,
        totalSeconds,
      };
      this.saveTimerState(mesaId, state);
    }
  }

  /** Calcula los segundos restantes en tiempo real */
  getRemaining(mesaId: number): number {
    const state = this.getTimerState(mesaId);
    if (!state) return 0;

    let elapsed = state.elapsedBeforePause;
    if (state.running && state.startedAt) {
      elapsed += (Date.now() - state.startedAt) / 1000;
    }

    const remaining = Math.max(0, state.totalSeconds - Math.floor(elapsed));
    return remaining;
  }

  startTimer(mesaId: number) {
    const state = this.getTimerState(mesaId);
    if (!state || state.running || state.finished) return;

    state.startedAt = Date.now();
    state.running = true;
    this.saveTimerState(mesaId, state);
  }

  pauseTimer(mesaId: number) {
    const state = this.getTimerState(mesaId);
    if (!state || !state.running) return;

    // Acumular el tiempo transcurrido desde startedAt
    if (state.startedAt) {
      state.elapsedBeforePause += (Date.now() - state.startedAt) / 1000;
    }
    state.startedAt = null;
    state.running = false;
    this.saveTimerState(mesaId, state);
  }

  resetTimer(mesaId: number) {
    const state = this.getTimerState(mesaId);
    if (!state) return;

    state.startedAt = null;
    state.elapsedBeforePause = 0;
    state.running = false;
    state.finished = false;
    this.saveTimerState(mesaId, state);
  }

  markFinished(mesaId: number) {
    const state = this.getTimerState(mesaId);
    if (!state) return;

    state.running = false;
    state.finished = true;
    state.startedAt = null;
    this.saveTimerState(mesaId, state);
  }

  clearTimer(mesaId: number) {
    localStorage.removeItem(this.timerKey(mesaId));
  }

  // ─── Ranking ───

  getRanking(): PlayerStats[] {
    const saved = localStorage.getItem('ranking_jugadores');
    return saved ? JSON.parse(saved) : [];
  }

  clearRanking() {
    localStorage.removeItem('ranking_jugadores');
  }

  registrarResultadoPartida(
    nombresGanadores: string[],
    nombresPerdedores: string[],
    puntosGanadores: number,
    puntosPerdedores: number
  ) {
    const ranking = this.getRanking();

    const actualizarJugador = (
      nombre: string,
      ganada: boolean,
      puntos: number
    ) => {
      const nombreNormalizado = nombre.trim();
      if (!nombreNormalizado) return;

      let jugador = ranking.find(
        (j) => j.nombre.toLowerCase() === nombreNormalizado.toLowerCase()
      );

      if (!jugador) {
        jugador = {
          nombre: nombreNormalizado,
          juegosJugados: 0,
          partidasGanadas: 0,
          partidasPerdidas: 0,
          puntosObtenidos: 0,
        };
        ranking.push(jugador);
      }

      jugador.juegosJugados++;
      if (ganada) {
        jugador.partidasGanadas++;
      } else {
        jugador.partidasPerdidas++;
      }
      jugador.puntosObtenidos += puntos;
    };

    nombresGanadores.forEach((n) => actualizarJugador(n, true, puntosGanadores));
    nombresPerdedores.forEach((n) => actualizarJugador(n, false, puntosPerdedores));

    localStorage.setItem('ranking_jugadores', JSON.stringify(ranking));
  }
}

