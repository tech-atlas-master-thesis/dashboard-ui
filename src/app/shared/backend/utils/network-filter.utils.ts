import { NetworkFilters, Project } from '../models/network.model';

export type Facet = 'programmes' | 'statuses' | 'dates';

export function toTime(value: any): number | null {
  if (value === null || value === undefined) return null;

  let raw: any = value;
  while (raw && typeof raw === 'object') {
    if ('$date' in raw) raw = raw.$date;
    else if ('$numberLong' in raw) raw = Number(raw.$numberLong);
    else break;
  }

  if (typeof raw === 'number') return raw;
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw !== 'string') return null;

  const iso = Date.parse(raw);
  if (!Number.isNaN(iso)) return iso;

  const m = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);

  return null;
}

export function matchesFilters(p: Project, f: NetworkFilters, except?: Facet): boolean {
  if (
    except !== 'programmes' &&
    f.programmes.length &&
    !(p.programme && f.programmes.includes(p.programme._id))
  )
    return false;

  if (except !== 'statuses' && f.statuses.length && !(p.status && f.statuses.includes(p.status)))
    return false;

  if (except !== 'dates' && (f.dateFrom || f.dateTo)) {
    const start = toTime(p.start);
    if (start === null) return false;
    if (f.dateFrom && start < Date.parse(f.dateFrom)) return false;
    if (f.dateTo && start > Date.parse(f.dateTo) + 86_399_999) return false;
  }

  return true;
}
