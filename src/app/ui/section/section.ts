import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SectionLayout = 'stack' | 'loose' | 'wrap';

const LAYOUT: Record<SectionLayout, string> = {
  stack: 'flex flex-col gap-2',
  loose: 'flex flex-col gap-3',
  wrap: 'flex flex-wrap gap-1.5',
};

@Component({
  selector: 'app-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-baseline gap-1">
        <p class="text-xs text-gray-500">{{ title() }}</p>
        @if (count()) {
          <p class="text-xs text-gray-400 tabular-nums">{{ count() }}</p>
        }
        @if (aside()) {
          <p class="ml-auto text-xs text-gray-500">{{ aside() }}</p>
        }
      </div>

      <div [class]="body()">
        <ng-content />
      </div>
    </div>
  `,
})
export class Section {
  readonly title = input.required<string>();
  readonly count = input('');
  readonly aside = input('');
  readonly layout = input<SectionLayout>('stack');

  protected readonly body = computed(() => `border-gray-100 border-t pt-2 ${LAYOUT[this.layout()]}`);
}
