import { Routes } from '@angular/router';
import { Home } from './routes/home/home';
import { Map } from './components/map/map';
import { BasicNetwork } from './components/basic-network/basic-network';
import { KeyTechnologies } from './routes/key-technologies/key-technologies';
import { KeyTechnologyDetail } from './routes/key-technology-detail/key-technology-detail';
import { KeyTechnologiesFieldNetwork } from './routes/key-technologies-field-network/key-technologies-field-network';

export const routes: Routes = [
  {
    path: '',
    component: KeyTechnologies,
  },
  {
    path: 'map',
    component: Map,
  },
  {
    path: 'basic-network',
    component: BasicNetwork,
  },
  {
    path: 'key-technologies',
    component: KeyTechnologies,
  },
  {
    path: 'key-technologies-field-network',
    component: KeyTechnologiesFieldNetwork,
  },
  {
    path: 'key-technologies/:id',
    component: KeyTechnologyDetail,
  },
  {
    path: 'home',
    component: Home,
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
