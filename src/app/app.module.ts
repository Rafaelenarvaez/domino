import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AnotadorComponent } from './components/anotador/anotador.component';
import { HomeComponent } from './components/home/home.component';
import { FormsModule } from '@angular/forms';
import { SplashComponent } from './components/splash/splash.component';
import { MesasComponent } from './components/mesas/mesas.component';
import { RankingComponent } from './components/ranking/ranking.component';
import { TorneoSetupComponent } from './components/torneo/torneo-setup/torneo-setup.component';
import { TorneoRondasComponent } from './components/torneo/torneo-rondas/torneo-rondas.component';
import { TorneoPosicionesComponent } from './components/torneo/torneo-posiciones/torneo-posiciones.component';

@NgModule({
  declarations: [
    AppComponent,
    AnotadorComponent,
    HomeComponent,
    SplashComponent,
    MesasComponent,
    RankingComponent,
    TorneoSetupComponent,
    TorneoRondasComponent,
    TorneoPosicionesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,   
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
