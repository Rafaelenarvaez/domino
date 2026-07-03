import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PartidaLocalService, PlayerStats } from '../../services/partida-local.service';

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnInit {

  ranking: PlayerStats[] = [];

  constructor(
    private service: PartidaLocalService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarRanking();
  }

  cargarRanking() {
    let datos = this.service.getRanking();
    
    // Ordenar por partidas ganadas (descendente) y luego por puntos obtenidos (descendente)
    datos.sort((a, b) => {
      if (b.partidasGanadas !== a.partidasGanadas) {
        return b.partidasGanadas - a.partidasGanadas;
      }
      return b.puntosObtenidos - a.puntosObtenidos;
    });

    this.ranking = datos;
  }

  volver() {
    this.router.navigate(['/']);
  }

  limpiarRanking() {
    if(confirm('¿Estás seguro de que deseas limpiar todo el ranking? Esta acción no se puede deshacer.')) {
      this.service.clearRanking();
      this.cargarRanking();
    }
  }
}
