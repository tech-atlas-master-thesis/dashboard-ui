import { Signal, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Event as RouterEvent, NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface OriginRef {
  url: string;
  label: string;
}

export function originState(url: string, label: string): { state: { origin: OriginRef } } {
  return { state: { origin: { url, label } } };
}

interface Known {
  url: string | null;
  label: string | null;
  inHistory: boolean;
}

function read(location: Location, route: ActivatedRoute): Known {
  const state = location.getState() as { origin?: OriginRef } | null;
  if (state?.origin?.url) {
    return { url: state.origin.url, label: state.origin.label ?? null, inHistory: true };
  }

  const params = route.snapshot.queryParamMap;
  return { url: params.get('from'), label: params.get('fromLabel'), inHistory: false };
}

export interface OriginConfig {
  title?: () => string;
  fallbackLabel?: string;
  home?: () => void;
}

export interface Origin {
  readonly backLabel: Signal<string>;
  goBack(): void;
  handover(label?: string): { state: { origin: OriginRef } };
}

export function useOrigin(config: OriginConfig = {}): Origin {
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  const location = inject(Location);
  const origin = signal(read(location, route));

  router.events.pipe(takeUntilDestroyed()).subscribe((event: RouterEvent) => {
    if (event instanceof NavigationEnd) origin.set(read(location, route));
  });

  const backLabel = computed(() => origin().label ?? config.fallbackLabel ?? 'Zurück zur Übersicht');

  return {
    backLabel,

    goBack(): void {
      const { url, inHistory } = origin();

      if (inHistory) {
        location.back();
        return;
      }

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

    handover(label?: string) {
      return originState(router.url, label ?? `Zurück zu ${config.title?.() || 'Übersicht'}`);
    },
  };
}
