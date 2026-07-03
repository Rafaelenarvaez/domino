import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PartidaLocalService, Mesa } from '../../services/partida-local.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  cantidadMesas: number = 1;
  mesas: Mesa[] = [];

  // ⏱ Cronómetro config
  cronometroHabilitado: boolean = false;
  cronometroMinutos: number = 30;

  constructor(private service: PartidaLocalService, private router: Router) {}

  ngOnInit(): void {
    this.generarMesas();
  }

  generarMesas() {
    if (this.cantidadMesas < 1) this.cantidadMesas = 1;

    this.mesas = [];
    for (let i = 1; i <= this.cantidadMesas; i++) {
      this.mesas.push({
        id: i,
        jugadores: {
          jugador1A: '',
          jugador2A: '',
          jugador1B: '',
          jugador2B: '',
        },
        puntosParaGanar: 100, // ✅ default
      });
    }
  }

  formCompleto(): boolean {
    if (!this.mesas.length) return false;

    return this.mesas.every(
      (m) =>
        m.jugadores.jugador1A.trim() &&
        m.jugadores.jugador2A.trim() &&
        m.jugadores.jugador1B.trim() &&
        m.jugadores.jugador2B.trim() &&
        (m.puntosParaGanar === 100 || m.puntosParaGanar === 200)
    );
  }

  crearPartida() {
    this.service.setMesas(this.mesas);

    // Guardar configuración del cronómetro
    this.service.setCronometroConfig({
      habilitado: this.cronometroHabilitado,
      minutos: this.cronometroMinutos,
    });

    // limpiamos anotadores previos y timers de todas las mesas
    this.mesas.forEach((m) => {
      localStorage.removeItem(`anotador_mesa_${m.id}`);
      this.service.clearTimer(m.id);
    });

    // Inicializar timers si se habilitó el cronómetro
    if (this.cronometroHabilitado) {
      this.mesas.forEach((m) => {
        this.service.initTimer(m.id, this.cronometroMinutos * 60);
      });
    }

    this.router.navigate(['/mesas']);
  }

  irACrearPartida() {
    document.getElementById('form-partida')?.scrollIntoView({
      behavior: 'smooth',
    });
  }

  irARanking() {
    this.router.navigate(['/ranking']);
  }

  irATorneo() {
    this.router.navigate(['/torneo/setup']);
  }
}
