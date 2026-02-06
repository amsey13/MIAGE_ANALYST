import { Component, ElementRef, effect, inject, viewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <--- IMPORTANT pour les inputs
import { DictionaryService } from '../../services/dictionary.service';
import BpmnModeler from 'bpmn-js/lib/Modeler';

@Component({
  selector: 'app-modeler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="layout">

      <aside class="sidebar left">
        <h3>Briques</h3>

        <div class="section">
          <h4>Acteurs</h4>
          @for (actor of service.actors(); track actor.id) {
            <div class="draggable-item actor"
                 [class.selected]="selectedObject === actor.name"
                 (click)="selectObject(actor.name)"
                 draggable="true"
                 (dragstart)="onDragStart($event, 'ACTEUR', actor.name)">

              <span>👤 {{ actor.name }}</span>

              <span class="badge" *ngIf="service.getAttributesFor(actor.name).length > 0">
                {{ service.getAttributesFor(actor.name).length }}
              </span>

            </div>
          }
        </div>

        <div class="section">
          <h4>Objets (Données)</h4>
          @for (objName of service.objects(); track objName) {
            <div class="draggable-item object"
                 [class.selected]="selectedObject === objName"
                 (click)="selectObject(objName)"
                 draggable="true"
                 (dragstart)="onDragStart($event, 'OBJET', objName)">
              <span>📄 {{ objName }}</span>
              <span class="badge" *ngIf="service.getAttributesFor(objName).length > 0">
                {{ service.getAttributesFor(objName).length }}
              </span>
            </div>
          }
        </div>
      </aside>

      <main class="canvas-wrapper" (dragover)="allowDrop($event)" (drop)="onDrop($event)">
        <div class="bpmn-container" #bpmnContainer></div>
      </main>

      <aside class="sidebar right">
        <h3>Détails Données</h3>

        @if (selectedObject) {
          <div class="inspector">
            <div class="header object">
              📄 {{ selectedObject }}
            </div>

            <p class="help-text">Définissez les champs de cette table pour le MCD.</p>

            <div class="add-attr-box">
              <input
                [(ngModel)]="newAttribute"
                placeholder="Nouvel attribut (ex: Date, Prix...)"
                (keyup.enter)="addAttr()"
                #attrInput
              />
              <button (click)="addAttr()">+</button>
            </div>

            <ul class="attr-list">
              @for (attr of service.getAttributesFor(selectedObject); track attr) {
                <li>
                  <span class="bullet">•</span>
                  {{ attr }}
                  <span class="remove" (click)="service.deleteAttribute(selectedObject, attr)">×</span>
                </li>
              } @empty {
                <li class="empty">Aucun attribut défini.</li>
              }
            </ul>
          </div>
        } @else {
          <div class="empty-state">
            <p>👈 Sélectionnez un <strong>Objet</strong> dans la liste de gauche pour définir ses attributs.</p>
          </div>
        }
      </aside>

    </div>
  `,
  styles: [`
    .layout { display: flex; height: calc(100vh - 60px); }

    .sidebar { width: 250px; background: #f8f9fa; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; }
    .sidebar.left { border-right: 1px solid #ddd; }
    .sidebar.right { border-left: 1px solid #ddd; background: #fff; width: 280px; }

    .canvas-wrapper { flex: 1; background: white; position: relative; }
    .bpmn-container { width: 100%; height: 100%; }

    h3 { margin-top: 0; color: #2c3e50; font-size: 1.1rem; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h4 { margin: 15px 0 5px; color: #7f8c8d; font-size: 0.9rem; text-transform: uppercase; }

    /* ITEMS GAUCHE */
    .draggable-item {
      padding: 10px; margin-bottom: 5px; background: white; border: 1px solid #ccc; border-radius: 4px;
      cursor: pointer; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center;
    }
    .draggable-item:hover { background: #f1f1f1; }
    .draggable-item.selected { border-color: #f1c40f; background: #fffdf0; box-shadow: 0 0 5px rgba(241, 196, 15, 0.5); }

    .actor { border-left: 4px solid #3498db; }
    .object { border-left: 4px solid #f1c40f; }

    .badge { background: #eee; color: #555; font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; }

    /* INSPECTEUR DROITE */
    .header { font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; padding: 10px; border-radius: 4px; text-align: center; }
    .header.object { background: #fff3cd; color: #856404; }
    .help-text { font-size: 0.85rem; color: #777; margin-bottom: 15px; font-style: italic; }

    .add-attr-box { display: flex; gap: 5px; margin-bottom: 15px; }
    .add-attr-box input { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .add-attr-box button { background: #27ae60; color: white; border: none; width: 35px; border-radius: 4px; cursor: pointer; font-weight: bold; }

    .attr-list { list-style: none; padding: 0; }
    .attr-list li { padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    .attr-list li .bullet { color: #ccc; margin-right: 5px; }
    .attr-list li .remove { color: #e74c3c; cursor: pointer; font-weight: bold; padding: 0 5px; }
    .attr-list li .remove:hover { background: #ffebeb; border-radius: 3px; }
    .empty-state { color: #95a5a6; text-align: center; margin-top: 50px; line-height: 1.6; }

    /* CENSURE PALETTE BPMN (Comme vu avant) */
    ::ng-deep .djs-palette .entry[data-action="create.participant-expanded"],
    ::ng-deep .djs-palette .entry[data-action="create.participant"],
    ::ng-deep .djs-palette .entry[data-action="create.data-object"],
    ::ng-deep .djs-palette .entry[data-action="create.data-store"] {
      display: none !important;
    }
  `]
})
export class ModelerComponent {
  service = inject(DictionaryService);
  platformId = inject(PLATFORM_ID);

  bpmnRef = viewChild.required<ElementRef>('bpmnContainer');
  modeler: any;

  // Gestion de la sélection
  selectedObject: string | null = null;
  newAttribute = '';

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const container = this.bpmnRef()?.nativeElement;
        if (container && !this.modeler) {
          this.initBpmn(container);
        }
      }
    });
  }

  initBpmn(container: HTMLElement) {
    this.modeler = new BpmnModeler({
      container: container,
      keyboard: { bindTo: document }
    });
    this.modeler.createDiagram();
  }

  // --- LOGIQUE INSPECTEUR ---
  selectObject(name: string) {
    this.selectedObject = name;
    this.newAttribute = ''; // Reset input
  }

  addAttr() {
    if (this.selectedObject && this.newAttribute.trim()) {
      this.service.addAttribute(this.selectedObject, this.newAttribute.trim());
      this.newAttribute = '';
    }
  }

  // --- DRAG & DROP ---
  onDragStart(event: DragEvent, type: 'ACTEUR' | 'OBJET', name: string) {
    // Si c'est un objet, on le sélectionne aussi automatiquement
    if (type === 'OBJET') {
      this.selectObject(name);
    }

    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({ type, name }));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  allowDrop(event: DragEvent) { event.preventDefault(); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) return;
    const data = event.dataTransfer.getData('application/json');
    if (!data) return;
    const item = JSON.parse(data);

    const rect = this.bpmnRef().nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.createShape(item.type, item.name, x, y);
  }

  createShape(type: string, name: string, x: number, y: number) {
    const modeling = this.modeler.get('modeling');
    const elementFactory = this.modeler.get('elementFactory');
    const canvas = this.modeler.get('canvas');
    let shape;

    if (type === 'ACTEUR') {
      shape = elementFactory.createParticipantShape({
        type: 'bpmn:Participant',
        x, y, width: 400, height: 200, isExpanded: true
      });
    } else {
      shape = elementFactory.createShape({
        type: 'bpmn:DataObjectReference',
        x, y
      });
    }
    shape.businessObject.name = name;
    modeling.createShape(shape, { x, y }, canvas.getRootElement());
  }
}
