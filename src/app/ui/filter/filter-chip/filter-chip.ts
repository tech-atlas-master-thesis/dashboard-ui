import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../../icon/icon';

export interface FilterChipMeta {
  label: string;
  fullLabel?: string;
  numeric?: boolean;
}

@Component({
  selector: 'app-filter-chip',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
  template: `
    @if (set()) {
      <div class="h-6 pl-3 pr-1 rounded-2xl bg-gray-500 text-white text-xs flex items-center gap-1.5">
        <button type="button" (click)="toggled.emit()" class="flex items-center gap-2 cursor-pointer max-w-56 min-w-0">
          <span class="text-gray-200 shrink-0">{{ label() }}</span>

          @if (colors().length) {
            <span class="flex items-center shrink-0">
              @for (color of colors(); track $index) {
                <span class="w-2.5 h-2.5 rounded-full ring-2 ring-gray-500 -ml-1 first:ml-0" [style.background]="color"></span>
              }
            </span>
          }

          <span class="truncate" [class.tabular-nums]="numeric()">{{ summary() }}</span>
          <app-icon name="chevron" class="text-gray-300" />
        </button>

        <span class="w-px h-4 bg-gray-400"></span>

        <button
          type="button"
          (click)="cleared.emit()"
          [title]="label() + ' zurücksetzen'"
          class="px-1.5 text-gray-200 hover:text-white cursor-pointer flex items-center"
        >
          <app-icon name="close" />
        </button>
      </div>
    } @else {
      <button
        type="button"
        (click)="toggled.emit()"
        class="h-6 px-3 rounded-2xl border border-gray-200 bg-white text-xs text-gray-600 hover:border-gray-300 hover:text-gray-900 cursor-pointer flex items-center gap-2"
      >
        {{ fullLabel() }}
        <app-icon name="chevron" class="text-gray-400" />
      </button>
    }
  `,
})
export class FilterChip {
  readonly meta = input.required<FilterChipMeta>();
  readonly summary = input('');
  readonly set = input(false);
  readonly typeColors = input<string[]>([]);
  readonly toggled = output<void>();
  readonly cleared = output<void>();

  protected readonly colors = computed(() => this.typeColors().slice(0, 3));
  protected readonly label = computed(() => this.meta().label);
  protected readonly fullLabel = computed(() => this.meta().fullLabel || this.meta().label);
  protected readonly numeric = computed(() => this.meta().numeric === true);
}
