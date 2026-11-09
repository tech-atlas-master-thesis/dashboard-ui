import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Icon } from '@ui/icon/icon';
import { InfoState, InfoTab } from '../info-state/info-state';

@Component({
  selector: 'app-info-button',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
  template: `
    <button
      type="button"
      (click)="info.show(tab())"
      [title]="label()"
      [attr.aria-label]="label()"
      class="no-print relative z-50 flex h-7 w-7 cursor-pointer items-center justify-center rounded-2xl bg-gray-900 text-white hover:bg-gray-800"
    >
      <app-icon name="info" [size]="14" />
    </button>
  `,
})
export class InfoButton {
  protected readonly info = inject(InfoState);

  readonly label = input('Über den Atlas');
  readonly tab = input<InfoTab>('erklaerung');
}
