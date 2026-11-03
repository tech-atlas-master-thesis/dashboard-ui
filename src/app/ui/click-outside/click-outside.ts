import { booleanAttribute, DestroyRef, Directive, ElementRef, inject, input, output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
})
export class ClickOutside {
  readonly enabled = input(true, { alias: 'appClickOutsideEnabled', transform: booleanAttribute });
  readonly clickedOutside = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const onPointerDown = (event: Event) => {
      if (!this.enabled()) return;

      const target = event.target as Node | null;
      if (target && this.host.nativeElement.contains(target)) return;

      this.clickedOutside.emit();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('pointerdown', onPointerDown, true));
  }
}
