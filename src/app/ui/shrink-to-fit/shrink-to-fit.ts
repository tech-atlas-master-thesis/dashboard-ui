import { afterRenderEffect, Directive, effect, ElementRef, inject, input } from '@angular/core';

const size = (fallback: number) => (value: number | string) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

@Directive({
  selector: '[appShrinkToFit]',
})
export class ShrinkToFit {
  readonly max = input(13, { alias: 'appShrinkToFit', transform: size(13) });
  readonly min = input(10, { alias: 'appShrinkToFitMin', transform: size(10) });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private fitting = false;

  constructor() {
    const node = this.host.nativeElement;

    const fit = () => {
      if (this.fitting) return;
      this.fitting = true;

      let size = this.max();
      node.style.fontSize = `${size}px`;

      while (size > this.min() && node.scrollWidth > node.clientWidth + 1) {
        size -= 1;
        node.style.fontSize = `${size}px`;
      }

      this.fitting = false;
    };

    afterRenderEffect(() => {
      this.max();
      this.min();
      fit();
    });

    effect((onCleanup) => {
      const observer = new ResizeObserver(() => fit());
      observer.observe(node);
      onCleanup(() => observer.disconnect());
    });
  }
}
