import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FIELD_ICONS } from './field-icons';

@Component({
  selector: 'app-field-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }

    :host svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  template: `<span class="contents" [innerHTML]="markup()"></span>`,
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class FieldIcon {
  readonly name = input.required<string>();
  readonly size = input(30);

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly markup = computed(() => this.sanitizer.bypassSecurityTrustHtml(FIELD_ICONS[this.name()] ?? ''));
}
