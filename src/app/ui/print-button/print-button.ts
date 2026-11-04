import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-print-button',
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
      (click)="print()"
      [title]="label()"
      class="flex h-7 cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white px-3 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-900"
    >
      <app-icon name="print" [size]="13" [weight]="2" class="text-gray-400" />
      {{ label() }}
    </button>
  `,
})
export class PrintButton {
  readonly label = input('Drucken');

  print(): void {
    window.print();
  }
}
