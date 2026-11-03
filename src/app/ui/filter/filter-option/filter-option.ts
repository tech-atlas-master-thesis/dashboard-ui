import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface FilterOptionView {
  key: string;
  label: string;
  count: number;
  share: string;
  color?: string;
}

const NEUTRAL = '#9ca3af';

@Component({
  selector: 'app-filter-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <div class="flex items-center gap-2 h-7">
      <input type="checkbox" [id]="inputId()" [checked]="checked()" (change)="toggled.emit()" class="rounded cursor-pointer" />

      @if (option().color) {
        <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="option().color"></span>
      }

      <label [for]="inputId()" [title]="option().label" class="flex-1 min-w-0 text-xs cursor-pointer truncate">{{ option().label }}</label>

      <button type="button" (click)="onlyRequested.emit()" class="text-[10px] text-gray-400 hover:text-gray-900 underline cursor-pointer">nur</button>

      <span class="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
        <span class="block h-1.5 rounded-full" [style.width]="option().share" [style.background]="barColor()"></span>
      </span>

      <p class="w-8 text-right text-xs text-gray-500 tabular-nums">{{ shown() }}</p>
    </div>
  `,
})
export class FilterOption {
  readonly option = input.required<FilterOptionView>();
  readonly inputId = input.required<string>();
  readonly checked = input(false);
  readonly toggled = output<void>();
  readonly onlyRequested = output<void>();

  protected readonly barColor = computed(() => this.option().color ?? NEUTRAL);
  protected readonly shown = computed(() => this.option().count.toLocaleString('de-AT'));
}
