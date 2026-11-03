import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export const SPINNER_CLASS = 'border-4 border-gray-200 border-t-black rounded-full animate-spin';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
  template: `<div [class]="classes()" role="status" aria-label="Wird geladen"></div>`,
})
export class Spinner {
  readonly size = input<'md' | 'lg'>('md');

  protected readonly classes = computed(() => `${SPINNER_CLASS} ${this.size() === 'lg' ? 'w-10 h-10' : 'w-8 h-8'}`);
}
