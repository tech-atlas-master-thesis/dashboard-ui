import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <div class="rounded-2xl py-2 px-4 flex flex-col gap-1 border" [style.border-color]="accent()">
      <p class="text-xs text-gray-500">{{ label() }}</p>
      <p class="text-xl font-medium tabular-nums">{{ value() }}</p>
    </div>
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly accent = input('#e5e7eb');
}
