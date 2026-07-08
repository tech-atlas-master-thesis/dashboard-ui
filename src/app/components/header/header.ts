import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { DatasetSelect } from '../dataset-select/dataset-select';

@Component({
  selector: 'app-header',
  imports: [RouterModule, DatasetSelect],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {}
