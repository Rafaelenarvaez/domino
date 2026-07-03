import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TorneoService, TorneoState } from '../../../services/torneo.service';
import { PartidaLocalService, Mesa } from '../../../services/partida-local.service';

@Component({
  selector: 'app-torneo-rondas',
  templateUrl: './torneo-rondas.component.html',
  styleUrls: ['./torneo-rondas.component.scss']
})
export class TorneoRondasComponent implements OnInit {

  state!: TorneoState;

  constructor(
    public torneoService: TorneoService,
    private partidaService: PartidaLocalService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.state = this.torneoService.getState();
    if (!this.state.activo) {
      this.router.navigate(['/']);
    }
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
