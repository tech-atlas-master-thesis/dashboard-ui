import { Component, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { PrintHeader } from '@ui/print-header/print-header';
import { InfoDialog } from '@shared/info/info-dialog/info-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, RouterModule, PrintHeader, InfoDialog],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('techAtlas-dashboard-ui');
}
