import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PartidaLocalService, Mesa } from '../../services/partida-local.service';

@Component({
  selector: 'app-mesas',
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.scss']
})
export class MesasComponent implements OnInit {

  mesas: Mesa[] = [];

  constructor(
    private service: PartidaLocalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.mesas = this.service.getMesas();
  }

  irAMesa(id: number) {
    this.router.navigate(['/anotador', id]);
  }

  volver() {
    this.router.navigate(['/']);
  }
}
