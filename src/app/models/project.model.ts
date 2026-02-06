export interface Actor {
  id: string;
  name: string; // ex: Bibliothécaire
  role?: string;
}

export interface UserStory {
  id: string;
  actorId: string; // Lien vers l'acteur
  description: string; // ex: "Enregistrer un emprunt"
  objectName: string; // ex: "Livre" (L'objet manipulé)
}
