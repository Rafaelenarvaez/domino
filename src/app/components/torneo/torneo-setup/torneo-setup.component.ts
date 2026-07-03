import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TorneoService } from '../../../services/torneo.service';
import { PartidaLocalService } from '../../../services/partida-local.service';

@Component({
  selector: 'app-torneo-setup',
  templateUrl: './torneo-setup.component.html',
  styleUrls: ['./torneo-setup.component.scss']
})
export class TorneoSetupComponent implements OnInit {

  nombreTorneo: string = 'Torneo de Dominó';
  totalRondas: number = 3;
  puntosParaGanar: number = 100;
  
  jugadores: { nombre: string }[] = [];
  nuevoJugador: string = '';

  // ⏱ Cronómetro config
  cronometroHabilitado: boolean = false;
  cronometroMinutos: number = 30;

  constructor(
    private torneoService: TorneoService,
    private partidaService: PartidaLocalService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Inicialmente agregamos 4 campos vacíos para facilitar
    for (let i = 0; i < 4; i++) {
      this.jugadores.push({ nombre: '' });
    }
  }

  agregarJugador() {
    this.jugadores.push({ nombre: '' });
  }

  eliminarJugador(index: number) {
    this.jugadores.splice(index, 1);
  }

  get jugadoresValidos(): string[] {
    return this.jugadores
      .map(j => j.nombre.trim())
      .filter(n => n.length > 0);
  }

  esValido(): boolean {
    const validos = this.jugadoresValidos;
    return this.nombreTorneo.trim().length > 0 &&
           this.totalRondas > 0 &&
           validos.length >= 4 &&
           validos.length % 4 === 0;
  }

  iniciarTorneo() {
    if (!this.esValido()) return;
    
    // Limpiar estado de cualquier mesa previa (hasta un máximo conservador de 40 mesas)
    for (let i = 1; i <= 40; i++) {
      localStorage.removeItem(`anotador_mesa_${i}`);
      this.partidaService.clearTimer(i);
    }
    
    // Aplicar configuración del cronómetro al torneo
    this.partidaService.setCronometroConfig({
      habilitado: this.cronometroHabilitado,
      minutos: this.cronometroMinutos
    });

    this.torneoService.iniciarTorneo(
      this.nombreTorneo,
      this.totalRondas,
      this.puntosParaGanar,
      this.jugadoresValidos
    );

    // Inicializar timers para las mesas de la ronda 1 si el cronómetro está habilitado
    if (this.cronometroHabilitado) {
      const mesasActuales = this.torneoService.getState().mesasRondaActual;
      mesasActuales.forEach(m => {
        this.partidaService.initTimer(m.id, this.cronometroMinutos * 60);
      });
    }

    this.router.navigate(['/torneo/rondas']);
  }

  volver() {
    this.router.navigate(['/']);
  }
}
