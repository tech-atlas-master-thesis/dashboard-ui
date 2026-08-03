import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Map } from '../../components/map/map';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
