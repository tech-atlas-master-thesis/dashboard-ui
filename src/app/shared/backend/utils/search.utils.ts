export interface SearchPart {
  text: string;
  hit: boolean;
}

export interface SearchHit {
  id: string;
  label: string;
  parts: SearchPart[];
  hint: string;
  color?: string;
}

export const MIN_SEARCH_LENGTH = 2;

const WORD_BREAK = '[\\s\\-–—/(\\[.,:;"\']';

export interface Matcher {
  term: string;
  active: boolean;
  matches(text: string | null | undefined): boolean;
  rank(text: string): number;
  split(text: string): SearchPart[];
}

export function createMatcher(raw: string): Matcher {
  const term = raw.trim().toLowerCase();
  const active = term.length >= MIN_SEARCH_LENGTH;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const atWordStart = new RegExp(`(^|${WORD_BREAK})${escaped}`, 'i');

  return {
    term,
    active,

    matches(text) {
      return active && (text ?? '').toLowerCase().includes(term);
    },

    rank(text) {
      if (!active) return 0;
      if (text.toLowerCase().startsWith(term)) return 0;
      return atWordStart.test(text) ? 1 : 2;
    },

    split(text) {
      if (!active) return [{ text, hit: false }];

      const parts: SearchPart[] = [];
      const lower = text.toLowerCase();
      let from = 0;

      for (let at = lower.indexOf(term); at !== -1; at = lower.indexOf(term, from)) {
        if (at > from) parts.push({ text: text.slice(from, at), hit: false });
        parts.push({ text: text.slice(at, at + term.length), hit: true });
        from = at + term.length;
      }
      if (from < text.length) parts.push({ text: text.slice(from), hit: false });

      return parts;
    },
  };
}

export function toHits<T>(
  items: readonly T[],
  matcher: Matcher,
  toHit: (item: T) => Omit<SearchHit, 'parts'> | null,
): SearchHit[] {
  if (!matcher.active) return [];

  const hits: SearchHit[] = [];
  for (const item of items) {
    const base = toHit(item);
    if (!base) continue;
    hits.push({ ...base, parts: matcher.split(base.label) });
  }

  return hits.sort(
    (a, b) => matcher.rank(a.label) - matcher.rank(b.label) || a.label.localeCompare(b.label),
  );
}
