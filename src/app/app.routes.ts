import { Routes } from '@angular/router';
import { Home } from './routes/home/home';
import { KeyTechnologies } from './routes/key-technologies/key-technologies';
import { KeyTechnologyDetail } from './routes/key-technology-detail/key-technology-detail';
import { Organisation } from './routes/organisation/organisation';
import { Project } from './routes/project/project';

export const routes: Routes = [
  {
    path: '',
    component: KeyTechnologies,
  },
  {
    path: 'key-technologies',
    component: KeyTechnologies,
  },
  {
    path: 'key-technologies/:id',
    component: KeyTechnologyDetail,
  },
  {
    path: 'organisation/:id',
    component: Organisation,
  },
  {
    path: 'project/:id',
    component: Project,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
