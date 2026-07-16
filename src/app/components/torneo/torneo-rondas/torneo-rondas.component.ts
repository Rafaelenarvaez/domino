import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TorneoService, TorneoState } from '../../../services/torneo.service';
import { PartidaLocalService, Mesa } from '../../../services/partida-local.service';

@Component({
  selector: 'app-torneo-rondas',
  templateUrl: './torneo-rondas.component.html',
  styleUrls: ['./torneo-rondas.component.scss']
})
export class TorneoRondasComponent implements OnInit, OnDestroy {

  state!: TorneoState;

  // ⏱ Cronómetro global (basado en Mesa 1)
  cronometroConfig: any = { habilitado: false, minutos: 30 };
  timerRemaining: number = 0;
  timerRunning: boolean = false;
  timerFinished: boolean = false;
  private refreshInterval: any = null;
  mesaMaestraId = 1;

  constructor(
    public torneoService: TorneoService,
    private partidaService: PartidaLocalService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.state = this.torneoService.getState();
    if (!this.state.activo) {
      this.router.navigate(['/']);
      return;
    }

    if (this.state.mesasRondaActual.length > 0) {
      this.mesaMaestraId = this.state.mesasRondaActual[0].id;
    }

    // ⏱ Inicializar cronómetro global
    this.cronometroConfig = this.partidaService.getCronometroConfig();
    if (this.cronometroConfig.habilitado) {
      this.refreshTimerDisplay();
      this.refreshInterval = setInterval(() => {
        this.refreshTimerDisplay();
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ⏱ Timer methods
  private refreshTimerDisplay() {
    const state = this.partidaService.getTimerState(this.mesaMaestraId);
    if (!state) return;

    this.timerRemaining = this.partidaService.getRemaining(this.mesaMaestraId);
    this.timerRunning = state.running;
    this.timerFinished = state.finished;

    if (this.timerRemaining <= 0 && state.running) {
      this.state.mesasRondaActual.forEach(m => this.partidaService.markFinished(m.id));
      this.timerRunning = false;
      this.timerFinished = true;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  iniciarTimer() {
    this.state.mesasRondaActual.forEach(m => this.partidaService.startTimer(m.id));
    this.refreshTimerDisplay();
  }

  pausarTimer() {
    this.state.mesasRondaActual.forEach(m => this.partidaService.pauseTimer(m.id));
    this.refreshTimerDisplay();
  }

  reiniciarTimer() {
    this.state.mesasRondaActual.forEach(m => this.partidaService.resetTimer(m.id));
    this.refreshTimerDisplay();
  }

  abrirMesa(mesaId: number) {
    // Asegurarse de que el servicio de Partida Local tenga estas mesas para que el anotador funcione
    this.partidaService.setMesas(this.state.mesasRondaActual);
    this.router.navigate(['/anotador', mesaId]);
  }

  verPosiciones() {
    this.router.navigate(['/torneo/posiciones']);
  }

  siguienteRonda() {
    // Limpiar estado previo (puntos y cronómetro) de las mesas usadas en la ronda actual
    this.state.mesasRondaActual.forEach(m => {
      localStorage.removeItem(`anotador_mesa_${m.id}`);
      this.partidaService.clearTimer(m.id);
    });

    this.torneoService.generarSiguienteRonda();
    this.state = this.torneoService.getState();

    // Inicializar cronómetro para las nuevas mesas si está habilitado
    if (this.cronometroConfig && this.cronometroConfig.habilitado) {
      this.state.mesasRondaActual.forEach(m => {
        this.partidaService.initTimer(m.id, this.cronometroConfig.minutos * 60);
      });
      // Asegurarse de que el maestro id esté actualizado
      if (this.state.mesasRondaActual.length > 0) {
        this.mesaMaestraId = this.state.mesasRondaActual[0].id;
      }
      this.refreshTimerDisplay();
    }
  }

  finalizarTorneo() {
    this.state.mesasRondaActual.forEach(m => {
      localStorage.removeItem(`anotador_mesa_${m.id}`);
      this.partidaService.clearTimer(m.id);
    });
    this.torneoService.finalizarTorneo();
    this.router.navigate(['/torneo/posiciones']);
  }
}
