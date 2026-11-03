import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SearchHit } from '@shared/utils/search.utils';

@Component({
  selector: 'app-hit-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <button
      type="button"
      [id]="'hit-' + hit().id"
      (click)="picked.emit()"
      [title]="hit().label"
      [class.bg-gray-100]="active()"
      [class.h-9]="dense()"
      [class.h-10]="!dense()"
      class="w-full flex items-center gap-2.5 px-2 text-left cursor-pointer rounded-xl hover:bg-gray-50"
    >
      @if (kind() === 'project') {
        <span class="w-2.5 h-2.5 rounded-xs shrink-0 bg-slate-600"></span>
      } @else {
        <span class="w-2.5 h-2.5 rounded-full shrink-0" [style.background]="hit().color"></span>
      }

      <span class="flex-1 min-w-0 text-xs truncate text-gray-600">
        @for (part of hit().parts; track $index) {
          <span [class.font-semibold]="part.hit" [class.text-gray-900]="part.hit">{{ part.text }}</span>
        }
      </span>

      @if (hit().hint) {
        <span class="text-[10px] text-gray-400 shrink-0 truncate" [class.max-w-44]="dense()" [class.max-w-56]="!dense()">{{ hit().hint }}</span>
      }

      @if (!dense()) {
        <span class="text-sm text-gray-300 shrink-0">→</span>
      }
    </button>
  `,
})
export class HitRow {
  readonly hit = input.required<SearchHit>();
  readonly kind = input<'organisation' | 'project'>('organisation');
  readonly active = input(false);
  readonly variant = input<'page' | 'popup'>('page');
  readonly picked = output<void>();

  protected readonly dense = computed(() => this.variant() === 'popup');
}
