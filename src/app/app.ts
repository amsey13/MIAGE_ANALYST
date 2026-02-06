import { Component, inject, Renderer2 } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <nav class="navbar">
        <div class="brand">MIAGE Analyst</div>
        <div class="links">
          <a routerLink="/actors" routerLinkActive="active">1. Acteurs</a>
          <a routerLink="/stories" routerLinkActive="active">2. User Stories</a>
          <a routerLink="/modeler" routerLinkActive="active">3. Modélisation</a>
          <a routerLink="/export" routerLinkActive="active">4. Export</a>
        </div>
      </nav>

      <main class="content">
        <router-outlet></router-outlet>
      </main>

      <div class="wireframe-toggle">
        <button (click)="toggleWireframe()">
          {{ isWireframe ? '👁️ MODE NORMAL' : '📐 MODE WIREFRAME' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .layout { height: 100vh; display: flex; flex-direction: column; font-family: 'Segoe UI', sans-serif; background: #f4f6f7; }

    .navbar { background: #2c3e50; color: white; padding: 0 20px; height: 60px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .brand { font-weight: 900; font-size: 1.2rem; letter-spacing: 1px; }

    .links { display: flex; gap: 5px; height: 100%; }
    .links a {
      color: #bdc3c7; text-decoration: none; padding: 0 20px; display: flex; align-items: center; height: 100%; border-bottom: 4px solid transparent; transition: all 0.2s;
    }
    .links a:hover:not(.disabled) { background: rgba(255,255,255,0.1); color: white; }
    .links a.active { border-bottom-color: #3498db; color: white; background: rgba(255,255,255,0.05); }
    .links a.disabled { opacity: 0.3; cursor: not-allowed; }

    .content { flex: 1; overflow-y: auto; }

    /* STYLE DU BOUTON FLOTTANT */
    .wireframe-toggle { position: fixed; bottom: 20px; right: 20px; z-index: 9999; }
    .wireframe-toggle button {
      padding: 10px 20px;
      background: #000;
      color: #fff;
      font-family: monospace;
      border: 2px solid white;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    .wireframe-toggle button:hover { background: #333; }
  `]
})
export class App {
  // Injection des services nécessaires
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);

  isWireframe = false;

  toggleWireframe() {
    this.isWireframe = !this.isWireframe;

    if (this.isWireframe) {
      // Ajoute la classe globale au <body>
      this.renderer.addClass(this.document.body, 'wireframe-active');
    } else {
      // Enlève la classe globale
      this.renderer.removeClass(this.document.body, 'wireframe-active');
    }
  }
}
