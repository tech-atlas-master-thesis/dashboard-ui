import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatasetSelect } from '../dataset-select/dataset-select';
import { InfoButton } from '@shared/info/info-button/info-button';

@Component({
  selector: 'app-header',
  imports: [RouterModule, DatasetSelect, InfoButton],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {}
