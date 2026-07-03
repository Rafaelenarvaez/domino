import { Injectable } from '@angular/core';
import { Mesa } from './partida-local.service';

export interface JugadorTorneo {
  id: string;
  nombre: string;
  pg: number; // Partidas Ganadas
  pp: number; // Partidas Perdidas
  puntosFavor: number;
  puntosContra: number;
  diferencia: number;
}

export interface TorneoState {
  activo: boolean;
  nombre: string;
  rondaActual: number;
  totalRondas: number;
  puntosParaGanar: number;
  jugadores: JugadorTorneo[];
  mesasRondaActual: Mesa[];
  mesasTerminadas: number;
}

@Injectable({
  providedIn: 'root'
})
export class TorneoService {
  
  private state: TorneoState = this.loadState();

  private loadState(): TorneoState {
    const saved = localStorage.getItem('torneo_state');
    if (saved) {
      return JSON.parse(saved);
    }
    return this.defaultState();
  }

  private defaultState(): TorneoState {
    return {
      activo: false,
      nombre: '',
      rondaActual: 0,
      totalRondas: 3,
      puntosParaGanar: 100,
      jugadores: [],
      mesasRondaActual: [],
      mesasTerminadas: 0
    };
  }

  private saveState() {
    localStorage.setItem('torneo_state', JSON.stringify(this.state));
  }

  getState(): TorneoState {
    return this.state;
  }

  iniciarTorneo(nombre: string, totalRondas: number, puntosParaGanar: number, nombresJugadores: string[]) {
    const jugadores: JugadorTorneo[] = nombresJugadores.map((n, i) => ({
      id: `J${i + 1}_${Date.now()}`,
      nombre: n,
      pg: 0,
      pp: 0,
      puntosFavor: 0,
      puntosContra: 0,
      diferencia: 0
    }));

    this.state = {
      activo: true,
      nombre,
      rondaActual: 0,
      totalRondas,
      puntosParaGanar,
      jugadores,
      mesasRondaActual: [],
      mesasTerminadas: 0
    };

    this.saveState();
    this.generarSiguienteRonda();
  }

  generarSiguienteRonda(): Mesa[] {
    if (!this.state.activo || this.state.rondaActual >= this.state.totalRondas) {
      return [];
    }

    this.state.rondaActual++;
    this.state.mesasTerminadas = 0;

    // Ordenar jugadores por PG (desc), luego DIF (desc), luego Favor (desc)
    let sortedJugadores = [...this.state.jugadores];
    if (this.state.rondaActual > 1) {
      sortedJugadores.sort((a, b) => {
        if (b.pg !== a.pg) return b.pg - a.pg;
        if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
        return b.puntosFavor - a.puntosFavor;
      });
    } else {
      // Ronda 1: Aleatorio
      sortedJugadores = sortedJugadores.sort(() => Math.random() - 0.5);
    }

    const mesas: Mesa[] = [];
    let mesaId = 1;

    // Agrupar de a 4
    for (let i = 0; i < sortedJugadores.length; i += 4) {
      const grupo = sortedJugadores.slice(i, i + 4);
      
      // Si no hay 4 justos, manejamos el bye (descanso) o mesa incompleta
      // Para simplificar, asumimos que siempre hay múltiplos de 4 (se valida en el setup)
      if (grupo.length === 4) {
        // Emparejamiento: 1 y 4 vs 2 y 3
        mesas.push({
          id: mesaId++,
          esTorneo: true,
          puntosParaGanar: this.state.puntosParaGanar,
          jugadores: {
            jugador1A: grupo[0].nombre,
            jugador2A: grupo[3].nombre,
            jugador1B: grupo[1].nombre,
            jugador2B: grupo[2].nombre
          },
          idsTorneo: {
            eq1: [grupo[0].id, grupo[3].id],
            eq2: [grupo[1].id, grupo[2].id]
          }
        });
      }
    }

    this.state.mesasRondaActual = mesas;
    this.saveState();
    return mesas;
  }

  registrarResultadoMesa(mesaId: number, eqGanador: 1 | 2, puntosEq1: number, puntosEq2: number) {
    const mesa = this.state.mesasRondaActual.find(m => m.id === mesaId);
    if (!mesa || !mesa.idsTorneo || mesa.resultadoRegistrado) return;

    // Actualizar estadísticas de los jugadores de esta mesa
    const actualizarJugador = (id: string, gano: boolean, puntosA: number, puntosC: number) => {
      const j = this.state.jugadores.find(x => x.id === id);
      if (j) {
        if (gano) j.pg++;
        else j.pp++;
        j.puntosFavor += puntosA;
        j.puntosContra += puntosC;
        j.diferencia = j.puntosFavor - j.puntosContra;
      }
    };

    mesa.idsTorneo.eq1.forEach(id => actualizarJugador(id, eqGanador === 1, puntosEq1, puntosEq2));
    mesa.idsTorneo.eq2.forEach(id => actualizarJugador(id, eqGanador === 2, puntosEq2, puntosEq1));

    mesa.resultadoRegistrado = true;
    this.state.mesasTerminadas++;
    this.saveState();
  }

  rondaCompletada(): boolean {
    return this.state.mesasTerminadas >= this.state.mesasRondaActual.length;
  }

  torneoTerminado(): boolean {
    return this.state.rondaActual >= this.state.totalRondas && this.rondaCompletada();
  }

  finalizarTorneo() {
    this.state.activo = false;
    this.saveState();
  }
}
