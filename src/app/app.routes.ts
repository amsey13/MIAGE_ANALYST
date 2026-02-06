import { Routes } from '@angular/router';
import { ActorsComponent } from './pages/actors/actors.component';
import { StoriesComponent } from './pages/stories/stories.component';
import { ModelerComponent } from './pages/modeler/modeler.component';
import { ExportComponent } from './pages/export/export.component';

// On importera les autres plus tard

export const routes: Routes = [
  { path: '', redirectTo: 'actors', pathMatch: 'full' },
  { path: 'actors', component: ActorsComponent },
  { path: 'stories', component: StoriesComponent },
  { path: 'modeler', component: ModelerComponent },
  { path: 'export', component: ExportComponent }    // À venir
];
