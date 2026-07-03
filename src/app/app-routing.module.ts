import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AnotadorComponent } from './components/anotador/anotador.component';
import { MesasComponent } from './components/mesas/mesas.component';
import { RankingComponent } from './components/ranking/ranking.component';
import { TorneoSetupComponent } from './components/torneo/torneo-setup/torneo-setup.component';
import { TorneoRondasComponent } from './components/torneo/torneo-rondas/torneo-rondas.component';
import { TorneoPosicionesComponent } from './components/torneo/torneo-posiciones/torneo-posiciones.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'mesas', component: MesasComponent },
  { path: 'anotador/:id', component: AnotadorComponent },
  { path: 'ranking', component: RankingComponent },
  { path: 'torneo/setup', component: TorneoSetupComponent },
  { path: 'torneo/rondas', component: TorneoRondasComponent },
  { path: 'torneo/posiciones', component: TorneoPosicionesComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: true }) // ✅ evita Cannot GET /mesas
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
