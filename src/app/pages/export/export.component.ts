import { Component, ElementRef, effect, inject, viewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DictionaryService } from '../../services/dictionary.service';

// Bibliothèques d'export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Bibliothèque graphique
import mermaid from 'mermaid';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-layout">

      <div class="preview-panel">
        <h2>4. Visualisation MCD</h2>
        <p class="subtitle">
          Schéma déduit automatiquement de vos <strong>Acteurs</strong> et <strong>Objets</strong>.
        </p>

        <div class="mermaid-container">
          <div class="mermaid" #mermaidDiv>
            {{ mermaidSource }}
          </div>
        </div>
      </div>

      <aside class="actions-panel">
        <h3>Résumé</h3>

        <div class="stats-grid">
          <div class="stat">
            <span class="val">{{ service.actors().length }}</span>
            <span class="lbl">Acteurs</span>
          </div>
          <div class="stat">
            <span class="val">{{ service.objects().length }}</span>
            <span class="lbl">Objets</span>
          </div>
          <div class="stat highlight">
            <span class="val">{{ getAllEntities().length }}</span>
            <span class="lbl">Tables</span>
          </div>
        </div>

        <div class="actions">
          <p class="desc">
            Le fichier <strong>.MCD</strong> inclus est compatible JMerise.
          </p>

          <button class="download-btn" (click)="downloadPack()">
            📦 TÉLÉCHARGER LE ZIP
          </button>
        </div>

        <div class="file-list">
          <div class="file">📄 rapport.pdf</div>
          <div class="file">🔶 projet.mcd (JMerise)</div>
        </div>
      </aside>

    </div>
  `,
  styles: [`
    .page-layout { display: flex; height: calc(100vh - 60px); overflow: hidden; }

    .preview-panel { flex: 1; background: white; padding: 20px; display: flex; flex-direction: column; }
    .actions-panel { width: 300px; background: #2c3e50; color: white; padding: 20px; display: flex; flex-direction: column; gap: 20px; }

    h2 { margin-top: 0; color: #2c3e50; }
    h3 { margin-top: 0; color: #ecf0f1; border-bottom: 1px solid #7f8c8d; padding-bottom: 10px; text-transform: uppercase; font-size: 0.9rem; }
    .subtitle { color: #7f8c8d; margin-bottom: 15px; }

    .mermaid-container {
      flex: 1; background: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;
      display: flex; align-items: center; justify-content: center; overflow: auto;
    }
    .mermaid { width: 100%; text-align: center; }

    .stats-grid { display: flex; gap: 5px; margin-bottom: 10px; }
    .stat { flex: 1; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px; text-align: center; }
    .stat.highlight { background: #e67e22; }
    .val { display: block; font-size: 1.2rem; font-weight: bold; }
    .lbl { font-size: 0.6rem; text-transform: uppercase; opacity: 0.8; }

    .download-btn {
      width: 100%; background: #27ae60; color: white; border: none; padding: 15px; border-radius: 6px;
      cursor: pointer; font-weight: bold; font-size: 1rem; transition: background 0.2s;
    }
    .download-btn:hover { background: #2ecc71; }

    .file-list { margin-top: auto; border-top: 1px solid #34495e; padding-top: 10px; }
    .file { padding: 5px 0; font-size: 0.85rem; color: #bdc3c7; }
  `]
})
export class ExportComponent {
  service = inject(DictionaryService);
  platformId = inject(PLATFORM_ID);

  mermaidDiv = viewChild.required<ElementRef>('mermaidDiv');
  mermaidSource = '';

  constructor() {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.renderDiagram();
      }
    });
  }

  // Fusionne Acteurs et Objets pour tout traiter comme des Entités
  getAllEntities(): string[] {
    const actors = this.service.actors().map(a => a.name);
    const objects = this.service.objects();
    return [...new Set([...actors, ...objects])].sort();
  }

  // --- RENDU MERMAID (VISUEL) ---
  async renderDiagram() {
    this.mermaidSource = this.generateMermaidCode();

    // Reset du DOM pour Mermaid
    const element = this.mermaidDiv().nativeElement;
    element.removeAttribute('data-processed');
    element.innerHTML = this.mermaidSource;

    try {
      await mermaid.run({ nodes: [element] });
    } catch (e) {
      console.error('Erreur Mermaid:', e);
    }
  }

  generateMermaidCode(): string {
    const entities = this.getAllEntities();
    if (entities.length === 0) return 'info\n  Aucune donnée\n';

    let code = 'erDiagram\n';

    entities.forEach(name => {
      const tableName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, '_');
      const pkName = `ID_${tableName}`;

      code += `  ${tableName} {\n`;
      code += `    int ${pkName} PK\n`;

      const attrs = this.service.getAttributesFor(name);
      if (attrs.length > 0) {
        attrs.forEach(attr => {
          const clean = attr.replace(/\s+/g, '_').toLowerCase();
          code += `    string ${clean}\n`;
        });
      } else {
        code += `    string libelle\n`;
      }
      code += `  }\n`;
    });
    return code;
  }

  // --- TÉLÉCHARGEMENT ---
  async downloadPack() {
    const zip = new JSZip();
    zip.file("rapport_projet.pdf", this.generatePDF());
    zip.file("projet.mcd", this.generateJMeriseXML()); // La version corrigée

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "projet_miage.zip");
  }

  // --- XML JMERISE (CORRIGÉ : IDs + Width + Height) ---
  generateJMeriseXML(): string {
    const entities = this.getAllEntities();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<MCD>\n  <ENTITIES>\n';

    entities.forEach((name, index) => {
      const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, '_');

      // Positionnement en grille (3 colonnes)
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 50 + (col * 250);
      const y = 50 + (row * 150);

      // ID unique obligatoire pour JMerise
      const entityId = index + 1;

      xml += `    <MCDEntity>\n`;
      xml += `      <id>${entityId}</id>\n`; // IMPORTANT
      xml += `      <name>${cleanName}</name>\n`;
      xml += `      <shortName>${cleanName.substring(0, 3)}</shortName>\n`;
      xml += `      <x>${x}</x>\n`;
      xml += `      <y>${y}</y>\n`;
      xml += `      <width>150</width>\n`;   // IMPORTANT
      xml += `      <height>100</height>\n`; // IMPORTANT
      xml += `      <attributes>\n`;

      // Clé primaire
      xml += `        <MCDAttribute>\n`;
      xml += `          <name>ID_${cleanName}</name>\n`;
      xml += `          <type>INTEGER</type>\n`;
      xml += `          <size></size>\n`;
      xml += `          <primaryKey>true</primaryKey>\n`;
      xml += `          <notNull>true</notNull>\n`;
      xml += `        </MCDAttribute>\n`;

      // Autres attributs
      const attrs = this.service.getAttributesFor(name);
      if (attrs.length > 0) {
        attrs.forEach(attr => {
          xml += `        <MCDAttribute>\n`;
          xml += `          <name>${attr.toUpperCase()}</name>\n`;
          xml += `          <type>VARCHAR</type>\n`;
          xml += `          <size>255</size>\n`;
          xml += `          <primaryKey>false</primaryKey>\n`;
          xml += `          <notNull>false</notNull>\n`;
          xml += `        </MCDAttribute>\n`;
        });
      } else {
        xml += `        <MCDAttribute>\n`;
        xml += `          <name>LIBELLE</name>\n`;
        xml += `          <type>VARCHAR</type>\n`;
        xml += `          <size>255</size>\n`;
        xml += `          <primaryKey>false</primaryKey>\n`;
        xml += `          <notNull>false</notNull>\n`;
        xml += `        </MCDAttribute>\n`;
      }

      xml += `      </attributes>\n`;
      xml += `    </MCDEntity>\n`;
    });

    xml += '  </ENTITIES>\n  <RELATIONS/>\n  <LINKS/>\n  <COMMENTS/>\n</MCD>';
    return xml;
  }

  // --- PDF REPORT ---
  generatePDF(): Blob {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Rapport MIAGE", 14, 20);

    // Table 1 : Entités
    doc.setFontSize(14);
    doc.text("1. Dictionnaire des Données", 14, 40);

    const entityData = this.getAllEntities().map(e => {
      const attrs = this.service.getAttributesFor(e);
      return [e, attrs.length > 0 ? attrs.join(', ') : 'Par défaut (Libellé)'];
    });

    autoTable(doc, {
      startY: 45,
      head: [['Entité', 'Attributs']],
      body: entityData
    });

    // Table 2 : User Stories
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("2. User Stories", 14, finalY);

    const storiesData = this.service.userStories().map(us => {
      const actorName = this.service.actors().find(a => a.id === us.actorId)?.name || '?';
      return [actorName, us.description, us.objectName];
    });

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Acteur', 'Besoin', 'Objet']],
      body: storiesData
    });

    return doc.output('blob');
  }
}
