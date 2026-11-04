import { Component, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { PrintButton } from '@ui/print-button/print-button';
import { PrintHeader } from '@ui/print-header/print-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, RouterModule, PrintHeader],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('techAtlas-dashboard-ui');
}
