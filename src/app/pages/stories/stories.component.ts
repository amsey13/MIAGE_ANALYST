import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DictionaryService } from '../../services/dictionary.service';

@Component({
  selector: 'app-stories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h2>2. User Stories (Besoins)</h2>
      <p class="subtitle">Définissez les fonctionnalités en reliant un Acteur à un Objet.</p>

      @if (service.actors().length === 0) {
        <div class="warning-box">
          ⚠️ Aucun acteur défini. Veuillez retourner à l'étape 1.
        </div>
      } @else {

        <div class="input-card">
          <div class="form-group">
            <label>En tant que...</label>
            <select [(ngModel)]="selectedActorId">
              <option value="" disabled selected>Choisir un acteur...</option>
              @for (actor of service.actors(); track actor.id) {
                <option [value]="actor.id">{{ actor.name }}</option>
              }
            </select>
          </div>

          <div class="form-group grow">
            <label>Je veux pouvoir...</label>
            <input [(ngModel)]="description" placeholder="ex: enregistrer un nouvel emprunt" />
          </div>

          <div class="form-group">
            <label>Sur l'objet...</label>
            <input [(ngModel)]="objectName" placeholder="ex: Livre" (keyup.enter)="add()" />
          </div>

          <button (click)="add()" [disabled]="!selectedActorId || !objectName">Ajouter</button>
        </div>

      }

      <div class="stories-list">
        @for (story of service.userStories(); track story.id) {
          <div class="story-card">
            <div class="story-text">
              <span class="role">En tant que <strong>{{ getActorName(story.actorId) }}</strong>,</span>
              je veux <span class="action">{{ story.description }}</span>
              sur l'objet <span class="object-tag">📄 {{ story.objectName }}</span>
            </div>
            <button class="delete-btn">×</button>
          </div>
        } @empty {
          <div class="empty">Aucune User Story définie.</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 20px; }
    h2 { color: #2c3e50; margin-bottom: 5px; }
    .subtitle { color: #7f8c8d; margin-bottom: 30px; }

    /* ALERTES */
    .warning-box { background: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; border: 1px solid #ffeeba; }

    /* FORMULAIRE */
    .input-card {
      display: flex; gap: 15px; background: white; padding: 20px; border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 30px; align-items: flex-end; flex-wrap: wrap;
    }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group.grow { flex: 1; min-width: 200px; }

    label { font-size: 12px; font-weight: bold; color: #7f8c8d; text-transform: uppercase; }
    input, select { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; height: 40px; box-sizing: border-box; }

    button {
      background: #27ae60; color: white; border: none; padding: 0 20px; height: 40px;
      border-radius: 4px; cursor: pointer; font-weight: bold;
    }
    button:disabled { background: #bdc3c7; cursor: not-allowed; }

    /* LISTE */
    .stories-list { display: flex; flex-direction: column; gap: 10px; }
    .story-card {
      background: white; padding: 15px 20px; border-radius: 6px; border-left: 5px solid #27ae60;
      display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .role strong { color: #2980b9; }
    .object-tag { background: #f1c40f; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; color: #333; font-weight: bold; }
    .empty { color: #95a5a6; font-style: italic; text-align: center; margin-top: 20px; }
    .delete-btn { background: none; color: #ccc; border: none; font-size: 20px; cursor: pointer; }
    .delete-btn:hover { color: #e74c3c; }
  `]
})
export class StoriesComponent {
  service = inject(DictionaryService);

  selectedActorId = '';
  description = '';
  objectName = '';

  add() {
    if (!this.selectedActorId || !this.description || !this.objectName) return;

    this.service.addUserStory(
      this.selectedActorId,
      this.description,
      this.objectName
    );

    // Reset partiel (on garde l'acteur car souvent on écrit plusieurs stories pour le même)
    this.description = '';
    this.objectName = '';
  }

  // Helper pour retrouver le nom de l'acteur à partir de l'ID
  getActorName(id: string): string {
    const actor = this.service.actors().find(a => a.id === id);
    return actor ? actor.name : 'Inconnu';
  }
}
