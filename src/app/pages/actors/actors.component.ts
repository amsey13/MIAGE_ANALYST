import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DictionaryService } from '../../services/dictionary.service';

@Component({
  selector: 'app-actors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h2>1. Identification des Acteurs</h2>
      <p class="subtitle">Qui intervient dans le système ? (Humains ou Systèmes externes)</p>

      <div class="input-card">
        <input
          [(ngModel)]="newActorName"
          placeholder="Nom de l'acteur (ex: Client, Admin...)"
          (keyup.enter)="add()"
        />
        <button (click)="add()">Ajouter Acteur</button>
      </div>

      <div class="list-grid">
        @for (actor of service.actors(); track actor.id) {
          <div class="card actor-card">
            <div class="icon">👤</div>
            <div class="name">{{ actor.name }}</div>
            <button class="delete-btn" (click)="service.deleteActor(actor.id)">×</button>
          </div>
        } @empty {
          <div class="empty">Aucun acteur défini. Commencez par en ajouter un.</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h2 { color: #2c3e50; margin-bottom: 5px; }
    .subtitle { color: #7f8c8d; margin-bottom: 30px; }

    .input-card { display: flex; gap: 10px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 30px; }
    input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
    button { background: #3498db; color: white; border: none; padding: 0 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
    button:hover { background: #2980b9; }

    .list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
    .card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; display: flex; align-items: center; gap: 10px; position: relative; }
    .actor-card { border-left: 5px solid #3498db; }
    .icon { font-size: 1.5rem; }
    .name { font-weight: bold; color: #34495e; }
    .delete-btn { position: absolute; right: 10px; background: transparent; color: #e74c3c; font-size: 20px; padding: 0; }
    .empty { color: #95a5a6; font-style: italic; text-align: center; grid-column: 1 / -1; }
  `]
})
export class ActorsComponent {
  service = inject(DictionaryService);
  newActorName = '';

  add() {
    if (!this.newActorName.trim()) return;
    this.service.addActor(this.newActorName);
    this.newActorName = '';
  }
}
