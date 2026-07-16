import { Component, OnInit, HostListener } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { App } from '@capacitor/app';
// @ts-ignore
import * as SpatialNavigation from 'spatial-navigation-js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  showSplash = true;
  showExitAppModal = false;
  title = 'anotador';

  constructor(private location: Location, private router: Router) {
    setTimeout(() => {
      this.showSplash = false;
    }, 2500); 
  }

  ngOnInit() {
    SpatialNavigation.init();
    
    // Add all standard elements plus table cells with tabindex
    SpatialNavigation.add({
      selector: 'button, input, select, a, [tabindex="0"]'
    });

    // Haz que navegue a lo primero que encuentre inicialmente
    SpatialNavigation.makeFocusable();
    SpatialNavigation.focus();

    // Actualiza los elementos navegables cada vez que cambiamos de pantalla
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          SpatialNavigation.makeFocusable();
        }, 100);
      }
    });

    App.addListener('backButton', (data) => {
      if (this.router.url === '/') {
        this.mostrarModalApp();
      } else if (this.router.url.includes('anotador')) {
        window.dispatchEvent(new CustomEvent('anotador-back'));
      } else {
        window.history.back();
      }
    });
  }

  mostrarModalApp() {
    this.showExitAppModal = true;
    setTimeout(() => {
      SpatialNavigation.add('exitAppModal', {
        selector: '#cancelExitBtn, .btn-confirm',
        restrict: 'self-only',
        defaultElement: '#cancelExitBtn'
      });
      SpatialNavigation.makeFocusable('exitAppModal');
      SpatialNavigation.focus('exitAppModal');
    }, 100);
  }

  confirmExit() {
    App.exitApp();
  }

  cancelExit() {
    this.showExitAppModal = false;
    SpatialNavigation.remove('exitAppModal');
    setTimeout(() => {
      SpatialNavigation.focus();
    }, 100);
  }

  // Listener global para la tecla "Atrás" (Escape o Backspace) en TV
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Backspace' || event.key === 'GoBack') {
      // Prevenir el comportamiento por defecto (ej. ir atrás en la historia del navegador que rompe la PWA)
      const tagName = (event.target as HTMLElement)?.tagName?.toLowerCase();
      // Si estamos escribiendo en un input, Backspace debe borrar, no volver atrás
      if (event.key === 'Backspace' && (tagName === 'input' || tagName === 'textarea')) {
        return;
      }
      
      event.preventDefault();
      
      if (this.router.url === '/') {
        this.mostrarModalApp();
      } else if (this.router.url.includes('anotador')) {
        window.dispatchEvent(new CustomEvent('anotador-back'));
      } else {
        this.location.back();
      }
    }
  }
}
