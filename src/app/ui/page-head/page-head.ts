import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ShrinkToFit } from '../shrink-to-fit/shrink-to-fit';

@Component({
  selector: 'app-page-head',
  imports: [ShrinkToFit],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      flex: 0 0 auto;
    }
  `,
  template: `
    <div class="flex h-8 items-center justify-between gap-4">
      <div class="flex min-w-0 flex-1 items-center gap-3.5">
        @if (label()) {
          <button type="button" (click)="back.emit()" class="shrink-0 cursor-pointer text-xs text-gray-500 hover:text-gray-900">
            {{ backLabel() }}
          </button>
          <div class="h-5 w-px shrink-0 bg-gray-300"></div>
          <p
            appShrinkToFit
            class="inline-flex h-7 min-w-0 items-center overflow-hidden rounded-full px-3.5 font-medium whitespace-nowrap text-white"
            [style.background]="color()"
          >
            {{ label() }}
          </p>
        }
      </div>

      <div class="flex shrink-0 items-center gap-4">
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHead {
  readonly label = input('');
  readonly color = input('#6b7280');
  readonly backLabel = input('← Zurück');
  readonly back = output<void>();
}
