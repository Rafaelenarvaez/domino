import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PartidaLocalService, Mesa } from '../../services/partida-local.service';

@Component({
  selector: 'app-mesas',
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.scss']
})
export class MesasComponent implements OnInit, OnDestroy {

  mesas: Mesa[] = [];

  // ⏱ Cronómetro global (basado en Mesa 1)
  cronometroConfig: any = { habilitado: false, minutos: 30 };
  timerRemaining: number = 0;
  timerRunning: boolean = false;
  timerFinished: boolean = false;
  private refreshInterval: any = null;
  mesaMaestraId = 1;

  constructor(
    private service: PartidaLocalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mesas = this.service.getMesas();
    if (this.mesas.length > 0) {
      this.mesaMaestraId = this.mesas[0].id;
    }

    // ⏱ Inicializar cronómetro global
    this.cronometroConfig = this.service.getCronometroConfig();
    if (this.cronometroConfig.habilitado) {
      this.mesas.forEach(m => {
        if (!this.service.getTimerState(m.id)) {
          this.service.initTimer(m.id, this.cronometroConfig.minutos * 60);
        }
      });
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
    const state = this.service.getTimerState(this.mesaMaestraId);
    if (!state) return;

    this.timerRemaining = this.service.getRemaining(this.mesaMaestraId);
    this.timerRunning = state.running;
    this.timerFinished = state.finished;

    if (this.timerRemaining <= 0 && state.running) {
      // Si se acaba el tiempo, marcamos todas las mesas como finalizadas
      this.mesas.forEach(m => this.service.markFinished(m.id));
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
    this.mesas.forEach(m => this.service.startTimer(m.id));
    this.refreshTimerDisplay();
  }

  pausarTimer() {
    this.mesas.forEach(m => this.service.pauseTimer(m.id));
    this.refreshTimerDisplay();
  }

  reiniciarTimer() {
    this.mesas.forEach(m => this.service.resetTimer(m.id));
    this.refreshTimerDisplay();
  }

  irAMesa(id: number) {
    this.router.navigate(['/anotador', id]);
  }

  volver() {
    this.router.navigate(['/']);
  }
}
