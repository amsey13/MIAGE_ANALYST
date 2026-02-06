import { Injectable, signal, computed } from '@angular/core';
import { Actor, UserStory } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class DictionaryService {
  // --- ÉTATS (SIGNALS) ---
  actors = signal<Actor[]>([]);
  userStories = signal<UserStory[]>([]);
  objectAttributes = signal<Record<string, string[]>>({});

  // --- CALCUL AUTOMATIQUE ---
  // Déduit la liste des objets uniques à partir des User Stories
  objects = computed(() => {
    const allNames = this.userStories().map(us => us.objectName);
    // Retire les doublons et trie
    return [...new Set(allNames)].sort();
  });

  // --- GESTION DES ACTEURS (Fonctions réintégrées) ---

  addActor(name: string) {
    if (!name.trim()) return;
    const newActor: Actor = {
      id: crypto.randomUUID(),
      name: name.trim()
    };
    this.actors.update(list => [...list, newActor]);
  }

  deleteActor(id: string) {
    this.actors.update(list => list.filter(a => a.id !== id));
  }

  // --- GESTION DES USER STORIES ---

  addUserStory(actorId: string, description: string, objectName: string) {
    const newUS: UserStory = {
      id: crypto.randomUUID(),
      actorId,
      description,
      objectName: objectName.trim()
    };
    this.userStories.update(list => [...list, newUS]);
  }

  // --- GESTION DES ATTRIBUTS (Le nouveau code) ---

  addAttribute(objectName: string, attributeName: string) {
    this.objectAttributes.update(record => {
      const currentList = record[objectName] || [];
      // On évite les doublons
      if (!currentList.includes(attributeName)) {
        return { ...record, [objectName]: [...currentList, attributeName] };
      }
      return record;
    });
  }

  deleteAttribute(objectName: string, attributeName: string) {
    this.objectAttributes.update(record => {
      const currentList = record[objectName] || [];
      return {
        ...record,
        [objectName]: currentList.filter(attr => attr !== attributeName)
      };
    });
  }

  getAttributesFor(objectName: string): string[] {
    return this.objectAttributes()[objectName] || [];
  }
}
