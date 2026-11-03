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
      <div class="flex h-7 items-center gap-1.5 rounded-full bg-gray-900 pr-1 pl-3 text-xs text-white">
        <button type="button" (click)="toggled.emit()" class="flex shrink-0 cursor-pointer items-center gap-2">
          {{ fullLabel() }}
          <app-icon name="chevron" class="text-white/70" />
        </button>

        <span class="h-4 w-px bg-white/25"></span>

        <button
          type="button"
          (click)="cleared.emit()"
          [title]="label() + ' zurücksetzen'"
          class="flex cursor-pointer items-center px-1.5 text-white/70 hover:text-white"
        >
          <app-icon name="close" />
        </button>
      </div>
    } @else {
      <button
        type="button"
        (click)="toggled.emit()"
        class="flex h-7 cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white px-3 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-900"
      >
        {{ fullLabel() }}
        <app-icon name="chevron" class="text-gray-400" />
      </button>
    }
  `,
})
export class FilterChip {
  readonly meta = input.required<FilterChipMeta>();
  readonly set = input(false);
  readonly toggled = output<void>();
  readonly cleared = output<void>();

  protected readonly label = computed(() => this.meta().label);
  protected readonly fullLabel = computed(() => this.meta().fullLabel || this.meta().label);
}
