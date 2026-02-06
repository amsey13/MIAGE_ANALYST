export interface PivotModel {
  sourceType: 'BPMN' | 'MCD';
  actors: string[];      // ex: ["Comptable", "Client"]
  dataObjects: string[]; // ex: ["Facture", "Commande"]
}

export interface AuditReport {
  globalScore: number;   // 0 à 100
  timestamp: Date;
  anomalies: Anomaly[];
}

export interface Anomaly {
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  suggestion: string;
}
