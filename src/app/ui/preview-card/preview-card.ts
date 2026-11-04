import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-preview-card',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <div class="backdrop-blur-sm rounded-2xl shadow-lg p-4 flex flex-col gap-2 border-l-4 border" [style.border-color]="accent()">
      <div class="flex justify-between gap-2">
        <p class="text-sm font-medium">{{ title() }}</p>
        <button type="button" (click)="closed.emit()" title="Schließen" class="text-gray-500 hover:text-gray-700 cursor-pointer flex items-center">
          <app-icon name="close" [size]="12" />
        </button>
      </div>

      <ng-content />

      <button
        type="button"
        (click)="actionRequested.emit()"
        class="group flex items-center justify-between mt-2 text-left cursor-pointer rounded-xl p-2"
        [style.background]="accent()"
      >
        <p class="text-xs font-medium text-white group-hover:underline">{{ actionLabel() }}</p>
        <p class="text-xs font-medium text-white">→</p>
      </button>
    </div>
  `,
})
export class PreviewCard {
  readonly title = input.required<string>();
  readonly accent = input.required<string>();
  readonly actionLabel = input.required<string>();
  readonly closed = output<void>();
  readonly actionRequested = output<void>();
}
