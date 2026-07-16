import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PartidaLocalService, Mesa, CronometroConfig, TimerState } from '../../services/partida-local.service';
import { TorneoService } from '../../services/torneo.service';
// @ts-ignore
import * as SpatialNavigation from 'spatial-navigation-js';

interface Jugador {
  id: string;
  nombre: string;
}

interface FilaPuntaje {
  equipo1: number;
  equipo2: number;
  anim: boolean;
  tachadoEquipo1: boolean;
  tachadoEquipo2: boolean;
}

@Component({
  selector: 'app-anotador',
  templateUrl: './anotador.component.html',
  styleUrls: ['./anotador.component.scss']
})
export class AnotadorComponent implements OnInit, OnDestroy {

  mesaId: number = 0;
  mesaData: Mesa | null = null;

  jugadoresEquipo1: Jugador[] = [];
  jugadoresEquipo2: Jugador[] = [];

  puntosParaGanar: number = 100;
  salidor: string | null = null;

  newScore1: number | null = null;
  newScore2: number | null = null;

  showModal = false;
  ganadorTexto = '';

  anotador = {
    puntajes: [
      { equipo1: 0, equipo2: 0, anim: false, tachadoEquipo1: false, tachadoEquipo2: false }
    ] as FilaPuntaje[],
    totales: { equipo1: 0, equipo2: 0 }
  };

  statsRegistradas: boolean = false;
  partidaTerminada: boolean = false;


  constructor(
    private route: ActivatedRoute,
    private service: PartidaLocalService,
    private torneoService: TorneoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.mesaId = Number(this.route.snapshot.paramMap.get('id'));

    const mesa = this.service.getMesa(this.mesaId);
    if (!mesa) {
      // si no hay datos, volver a inicio
      this.router.navigate(['/']);
      return;
    }

    this.mesaData = mesa;
    this.puntosParaGanar = mesa.puntosParaGanar;

    this.jugadoresEquipo1 = [
      { id: 'A1', nombre: mesa.jugadores.jugador1A },
      { id: 'A2', nombre: mesa.jugadores.jugador2A }
    ];

    this.jugadoresEquipo2 = [
      { id: 'B1', nombre: mesa.jugadores.jugador1B },
      { id: 'B2', nombre: mesa.jugadores.jugador2B }
    ];

    const saved = localStorage.getItem(`anotador_mesa_${this.mesaId}`);
    if (saved) {
      const s = JSON.parse(saved);
      if (s.anotador) {
        this.anotador = s.anotador;
      } else {
        this.anotador = s;
      }
      this.salidor = s.salidor ?? null;
      this.statsRegistradas = s.statsRegistradas ?? false;
      this.partidaTerminada = s.partidaTerminada ?? false;

      // Si la partida ya había terminado y se refresca, mostramos los resultados automáticamente
      if (this.partidaTerminada && !this.showModal) {
        setTimeout(() => this.mostrarResultados(), 500);
      }
    }

  }

  ngOnDestroy(): void {
  }

  private saveState() {
    const payload = {
      anotador: this.anotador,
      salidor: this.salidor,
      statsRegistradas: this.statsRegistradas,
      partidaTerminada: this.partidaTerminada
    };
    localStorage.setItem(`anotador_mesa_${this.mesaId}`, JSON.stringify(payload));
  }

  selectSalidor(id: string) {
    if (this.salidor) return;
    this.salidor = id;
    this.saveState();
  }



  confirmScore(equipo: 'equipo1' | 'equipo2', value: number | null) {
    if (this.partidaTerminada) return;
    if (value === null || value === undefined || value < 0) return;

    const entry: FilaPuntaje = {
      equipo1: 0,
      equipo2: 0,
      anim: true,
      tachadoEquipo1: false,
      tachadoEquipo2: false
    };

    entry[equipo] = value;

    this.anotador.puntajes.push(entry);
    this.anotador.totales[equipo] += value;
    this.anotador.totales[equipo] = Math.max(0, this.anotador.totales[equipo]);

    this.saveState();

    setTimeout(() => entry.anim = false, 600);

    if (equipo === 'equipo1') this.newScore1 = null;
    else this.newScore2 = null;
  }

  toggleTachar(i: number, equipo: 'equipo1' | 'equipo2') {
    if (this.partidaTerminada) return;
    const row = this.anotador.puntajes[i];
    const valor = row[equipo];

    if (equipo === 'equipo1') {
      if (!row.tachadoEquipo1)
        this.anotador.totales.equipo1 = Math.max(0, this.anotador.totales.equipo1 - valor);
      else
        this.anotador.totales.equipo1 += valor;

      row.tachadoEquipo1 = !row.tachadoEquipo1;
    }

    if (equipo === 'equipo2') {
      if (!row.tachadoEquipo2)
        this.anotador.totales.equipo2 = Math.max(0, this.anotador.totales.equipo2 - valor);
      else
        this.anotador.totales.equipo2 += valor;

      row.tachadoEquipo2 = !row.tachadoEquipo2;
    }

    this.saveState();
  }

  finalizarPartidaManual() {
    this.partidaTerminada = true;

    if (this.anotador.totales.equipo1 > this.anotador.totales.equipo2) {
      this.registrarStats(1);
    } else if (this.anotador.totales.equipo2 > this.anotador.totales.equipo1) {
      this.registrarStats(2);
    }

    this.saveState();
    this.mostrarResultados();
  }

  mostrarResultados() {
    if (this.anotador.totales.equipo1 > this.anotador.totales.equipo2) {
      this.ganadorTexto = `🏆 Ganó el equipo 1`;
    } else if (this.anotador.totales.equipo2 > this.anotador.totales.equipo1) {
      this.ganadorTexto = `🏆 Ganó el equipo 2`;
    } else {
      this.ganadorTexto = `⚖️ Empate`;
    }

    this.showModal = true;
      
    // Actualizar navegación espacial para atrapar el foco en el modal
    setTimeout(() => {
      SpatialNavigation.add('modal', {
        selector: '.modal-btn',
        restrict: 'self-only',
        defaultElement: '#btnVolverMesas'
      });
      SpatialNavigation.makeFocusable('modal');
      SpatialNavigation.focus('modal');
    }, 100);
  }

  private registrarStats(equipoGanador: 1 | 2) {
    if (this.statsRegistradas) return;

    if (this.mesaData?.esTorneo) {
      // Guardar en el Torneo (su propio ranking individual local)
      this.torneoService.registrarResultadoMesa(
        this.mesaId,
        equipoGanador,
        this.anotador.totales.equipo1,
        this.anotador.totales.equipo2
      );
    } else {
      // Guardar en el ranking global de Partida Tradicional
      let nombresGanadores: string[] = [];
      let nombresPerdedores: string[] = [];
      let puntosGanadores = 0;
      let puntosPerdedores = 0;

      if (equipoGanador === 1) {
        nombresGanadores = this.jugadoresEquipo1.map((j: Jugador) => j.nombre);
        nombresPerdedores = this.jugadoresEquipo2.map((j: Jugador) => j.nombre);
        puntosGanadores = this.anotador.totales.equipo1!;
        puntosPerdedores = this.anotador.totales.equipo2!;
      } else {
        nombresGanadores = this.jugadoresEquipo2.map((j: Jugador) => j.nombre);
        nombresPerdedores = this.jugadoresEquipo1.map((j: Jugador) => j.nombre);
        puntosGanadores = this.anotador.totales.equipo2!;
        puntosPerdedores = this.anotador.totales.equipo1!;
      }

      this.service.registrarResultadoPartida(
        nombresGanadores,
        nombresPerdedores,
        puntosGanadores,
        puntosPerdedores
      );
    }

    this.statsRegistradas = true;
    this.saveState();
  }

  volverAMesas() {
    if (this.mesaData?.esTorneo) {
      this.router.navigate(['/torneo/rondas']);
    } else {
      this.router.navigate(['/mesas']);
    }
  }

  nuevaPartida() {
    if (this.mesaData?.esTorneo) {
      alert('En un torneo no puedes reiniciar la partida desde aquí. Por favor vuelve a la pantalla de rondas.');
      return;
    }

    SpatialNavigation.remove('modal');

    this.anotador = {
      puntajes: [
        { equipo1: 0, equipo2: 0, anim: false, tachadoEquipo1: false, tachadoEquipo2: false }
      ],
      totales: { equipo1: 0, equipo2: 0 }
    };

    this.salidor = null;
    this.newScore1 = null;
    this.newScore2 = null;
    this.showModal = false;
    this.statsRegistradas = false;
    this.partidaTerminada = false;

    // Resetear el temporizador si existe
    this.service.resetTimer(this.mesaId);

    this.saveState();
  }

  showExitMatchModal = false;

  @HostListener('window:anotador-back', ['$event'])
  onAnotadorBack() {
    this.salir();
  }

  salir() {
    // Si ya terminó la partida y el modal de ganador está abierto, cerramos ese modal primero o salimos directamente
    if (this.showModal) {
      this.showModal = false;
      this.volverAMesas();
      return;
    }
    
    // Si no ha terminado, mostramos la confirmación
    this.showExitMatchModal = true;
    setTimeout(() => {
      SpatialNavigation.add('exitModal', {
        selector: '#cancelExitMatchBtn, .btn-volver-mesas',
        restrict: 'self-only',
        defaultElement: '#cancelExitMatchBtn'
      });
      SpatialNavigation.makeFocusable('exitModal');
      SpatialNavigation.focus('exitModal');
    }, 100);
  }

  confirmarSalida() {
    this.showExitMatchModal = false;
    SpatialNavigation.remove('exitModal');
    this.volverAMesas();
  }

  cancelarSalida() {
    this.showExitMatchModal = false;
    SpatialNavigation.remove('exitModal');
    setTimeout(() => {
      SpatialNavigation.focus();
    }, 100);
  }
}

