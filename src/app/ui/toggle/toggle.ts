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
    <div class="flex shrink-0 items-center gap-0.5 rounded-full border border-gray-300 bg-white p-0.5">
      @for (option of options(); track option.value) {
        <button
          type="button"
          (click)="changed.emit(option.value)"
          [class]="option.value === value() ? selected : idle"
          class="h-7 cursor-pointer rounded-full px-4 text-xs transition-colors"
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

  protected readonly selected = 'bg-gray-900 text-white font-medium';
  protected readonly idle = 'text-gray-500 hover:text-gray-900';
}
