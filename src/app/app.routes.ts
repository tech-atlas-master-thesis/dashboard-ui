import { Routes } from '@angular/router';
import { Home } from './routes/home/home';
import { Map } from './components/map/map';
import { BasicNetwork } from './components/basic-network/basic-network';

export const routes: Routes = [
  {
    path: '',
    component: Home,
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
    path: 'home',
    component: Home,
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
