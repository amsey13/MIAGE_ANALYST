import { Injectable } from '@angular/core';
import { PivotModel, AuditReport, Anomaly } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditEngineService {

  // 1. LE PARSEUR (Transforme le XML en Objet JS)
  async parseBPMN(file: File): Promise<PivotModel> {
    const text = await file.text(); // API Browser native (rapide)
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");

    // Extraction propre via Selectors
    // Note: Les balises BPMN ont souvent des namespace (bpmn:participant)
    const actors = Array.from(xml.querySelectorAll('participant, bpmn\\:participant'))
      .map(el => el.getAttribute('name') || 'Inconnu');

    const data = Array.from(xml.querySelectorAll('dataObjectReference, bpmn\\:dataObjectReference'))
      .map(el => el.getAttribute('name') || 'Inconnu');

    return { sourceType: 'BPMN', actors, dataObjects: data };
  }

  // Pour l'instant, on simule le MCD car on n'a pas ton fichier JMerise sous la main
  async parseMCD(file: File): Promise<PivotModel> {
    // TODO: Implémenter le parsing XML JMerise ici
    return { sourceType: 'MCD', actors: [], dataObjects: ['Facture', 'Client'] };
  }

  // 2. LE MOTEUR DE RÈGLES (Compare A et B)
  compare(bpmn: PivotModel, mcd: PivotModel): AuditReport {
    const anomalies: Anomaly[] = [];
    let score = 100;

    // Règle : Chaque Donnée du BPMN doit exister dans le MCD
    bpmn.dataObjects.forEach(obj => {
      // Comparaison insensible à la casse
      const exists = mcd.dataObjects.some(d => d.toLowerCase() === obj.toLowerCase());

      if (!exists) {
        score -= 15;
        anomalies.push({
          severity: 'CRITICAL',
          message: `L'objet "${obj}" est manipulé dans le processus mais absent du MCD.`,
          suggestion: `Ajoutez l'entité "${obj}" dans votre modèle de données.`
        });
      }
    });

    return {
      globalScore: Math.max(0, score),
      timestamp: new Date(),
      anomalies
    };
  }
}
