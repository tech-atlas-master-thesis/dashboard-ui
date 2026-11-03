import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
  template: `
    <div class="flex items-center gap-1 bg-gray-100 rounded-full p-0.5 shrink-0">
      @for (option of options(); track option.value) {
        <button
          type="button"
          (click)="changed.emit(option.value)"
          [class]="option.value === value() ? selected : idle"
          class="text-xs px-3 py-1 rounded-full cursor-pointer transition-colors"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class Toggle<T extends string> {
  readonly options = input.required<readonly ToggleOption<T>[]>();
  readonly value = input.required<T>();
  readonly changed = output<T>();

  protected readonly selected = 'bg-white text-gray-800 shadow-sm font-medium';
  protected readonly idle = 'text-gray-500 hover:text-gray-700';
}
