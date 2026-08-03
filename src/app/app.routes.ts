import { Routes } from '@angular/router';
import { Home } from './routes/home/home';
import { Map } from './components/map/map';
import { KeyTechnologies } from './routes/key-technologies/key-technologies';
import { KeyTechnologyDetail } from './routes/key-technology-detail/key-technology-detail';

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
    path: '**',
    redirectTo: 'home',
  },
];
