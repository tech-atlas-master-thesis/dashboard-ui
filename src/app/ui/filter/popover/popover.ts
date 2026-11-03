import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type PopoverWidth = '72' | '80' | '96';

@Component({
  selector: 'app-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: contents;
    }
  `,
  template: `
    <div
      [class.w-72]="width() === '72'"
      [class.w-80]="width() === '80'"
      [class.w-96]="width() === '96'"
      [class.max-h-96]="scroll()"
      [class.overflow-y-auto]="scroll()"
      class="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-2xl shadow-lg p-3 flex flex-col gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div class="flex items-baseline justify-between">
        <p class="text-xs text-gray-500">{{ title() }}</p>
        @if (resetLabel()) {
          <button type="button" (click)="resetRequested.emit()" class="text-xs text-gray-500 hover:text-gray-900 underline cursor-pointer">
            {{ resetLabel() }}
          </button>
        }
      </div>

      <ng-content />
    </div>
  `,
})
export class Popover {
  readonly title = input.required<string>();
  readonly width = input<PopoverWidth>('72');
  readonly resetLabel = input('');
  readonly scroll = input(false);
  readonly resetRequested = output<void>();
}
