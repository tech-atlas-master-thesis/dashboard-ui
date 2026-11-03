import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <div class="flex flex-col gap-0.5">
      <p class="text-xs text-gray-500">{{ label() }}</p>
      @if (href()) {
        <a [href]="href()" target="_blank" rel="noopener" class="text-sm hover:underline" [class.tabular-nums]="numeric()">
          {{ value() }}
        </a>
      } @else {
        <p class="text-sm" [class.tabular-nums]="numeric()">{{ value() }}</p>
      }
    </div>
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly value = input('');
  readonly href = input('');
  readonly numeric = input(false);
}
