import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName = 'chevron' | 'close' | 'search' | 'reset' | 'print';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
  `,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="weight()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('chevron') {
          <svg:polyline points="6,9 12,15 18,9" />
        }
        @case ('close') {
          <svg:line x1="6" y1="6" x2="18" y2="18" />
          <svg:line x1="18" y1="6" x2="6" y2="18" />
        }
        @case ('search') {
          <svg:circle cx="11" cy="11" r="7" />
          <svg:line x1="16.5" y1="16.5" x2="21" y2="21" />
        }
        @case ('reset') {
          <svg:path d="M20 11a8 8 0 1 0-2.3 6" />
          <svg:polyline points="20,4 20,11 13,11" />
        }
        @case ('print') {
          <svg:polyline points="7,9 7,3 17,3 17,9" />
          <svg:path d="M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
          <svg:rect x="7" y="14" width="10" height="7" rx="1" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(11);
  readonly weight = input(2.5);
}
