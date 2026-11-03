import { Signal, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface Handover {
  from: string;
  fromLabel: string;
}

export function handoverTo(router: Router, label: string): Handover {
  return { from: router.url, fromLabel: label };
}

export interface OriginConfig {
  title?: () => string;
  fallbackLabel?: string;
  home?: () => void;
}

export interface Origin {
  readonly backLabel: Signal<string>;
  goBack(): void;
  handover(label?: string): Handover;
}

export function useOrigin(config: OriginConfig = {}): Origin {
  const route = inject(ActivatedRoute);
  const router = inject(Router);

  const origin = signal<{ url: string | null; label: string | null }>({ url: null, label: null });

  route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params: ParamMap) => origin.set({ url: params.get('from'), label: params.get('fromLabel') }));

  const backLabel = computed(() => origin().label ?? config.fallbackLabel ?? 'Zurück zur Übersicht');

  return {
    backLabel,

    goBack(): void {
      const url = origin().url;
      if (url) {
        router.navigateByUrl(url);
        return;
      }
      if (config.home) {
        config.home();
        return;
      }
      router.navigate(['/key-technologies']);
    },

    handover(label?: string): Handover {
      return handoverTo(router, label ?? `Zurück zu ${config.title?.() || 'Übersicht'}`);
    },
  };
}
