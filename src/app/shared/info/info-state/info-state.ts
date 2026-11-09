import { Injectable, signal } from '@angular/core';

export type InfoTab = 'erklaerung' | 'daten' | 'impressum' | 'datenschutz';

@Injectable({ providedIn: 'root' })
export class InfoState {
  private readonly _open = signal(false);
  private readonly _tab = signal<InfoTab>('erklaerung');

  readonly open = this._open.asReadonly();
  readonly tab = this._tab.asReadonly();

  show(tab: InfoTab = 'erklaerung'): void {
    this._tab.set(tab);
    this._open.set(true);
  }

  hide(): void {
    this._open.set(false);
  }

  setTab(tab: InfoTab): void {
    this._tab.set(tab);
  }
}
