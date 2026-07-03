import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TorneoService, JugadorTorneo } from '../../../services/torneo.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-torneo-posiciones',
  templateUrl: './torneo-posiciones.component.html',
  styleUrls: ['./torneo-posiciones.component.scss']
})
export class TorneoPosicionesComponent implements OnInit {

  jugadores: JugadorTorneo[] = [];
  torneoActivo: boolean = false;
  nombreTorneo: string = '';

  constructor(
    private torneoService: TorneoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const state = this.torneoService.getState();
    this.torneoActivo = state.activo;
    this.nombreTorneo = state.nombre;
    this.cargarPosiciones();
  }

  cargarPosiciones() {
    let datos = [...this.torneoService.getState().jugadores];
    
    // Ordenar por PG (desc), DIF (desc), Favor (desc)
    datos.sort((a, b) => {
      if (b.pg !== a.pg) return b.pg - a.pg;
      if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
      return b.puntosFavor - a.puntosFavor;
    });

    this.jugadores = datos;
  }

  volver() {
    if (this.torneoActivo) {
      this.router.navigate(['/torneo/rondas']);
    } else {
      this.router.navigate(['/']);
    }
  }

  async exportarPDF() {
    const data = document.getElementById('tabla-posiciones-pdf');
    if (!data) return;

    try {
      const canvas = await html2canvas(data, {
        scale: 2, // Mayor calidad
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgWidth = 210; // A4 ancho en mm
      const pageHeight = 297; // A4 alto en mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;

      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 10; // Margen superior

      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Si la tabla es muy larga y requiere múltiples páginas
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Resultados_Torneo_${this.nombreTorneo}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF', error);
      alert('Hubo un error al exportar el PDF. Intenta nuevamente.');
    }
  }
}
