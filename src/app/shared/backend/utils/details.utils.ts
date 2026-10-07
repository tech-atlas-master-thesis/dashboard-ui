export type Oid = string | { $oid: string };
export type BsonDate = string | { $date: string };

export const oid = (value: Oid | null | undefined): string => {
  if (!value) return '';
  return typeof value === 'string' ? value : (value.$oid ?? '');
};

export const toDate = (value: BsonDate | null | undefined): Date | null => {
  if (!value) return null;
  const raw = typeof value === 'string' ? value : value.$date;
  if (!raw) return null;
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
};

const RUNNING_STATUS = new Set(['laufend', 'ongoing', 'running', 'in durchführung']);

export const isRunning = (status: string | null | undefined): boolean =>
  !!status && RUNNING_STATUS.has(status.trim().toLowerCase());

export const countRunning = (status: Record<string, number>): number =>
  Object.entries(status)
    .filter(([key]) => isRunning(key))
    .reduce((sum, [, value]) => sum + value, 0);

export const cleanKeywords = (keywords: string[] | null | undefined): string[] => {
  if (!keywords?.length) return [];
  return keywords
    .map((keyword) => (typeof keyword === 'string' ? keyword : ''))
    .map((keyword) => keyword.replace(/^[\s[\]'"]+|[\s[\]'"]+$/g, '').trim())
    .filter((keyword) => keyword.length > 0);
};

export const toParagraphs = (text: string | null | undefined): string[] => {
  if (!text) return [];
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .map((line) => line.trim())
        .join(' ')
        .trim(),
    )
    .filter((paragraph) => paragraph.length > 0);
};

export const titleCase = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.length > 3 && value === value.toUpperCase()
    ? value.charAt(0) + value.slice(1).toLowerCase()
    : value;
};

export const cityOnly = (city: string | null | undefined): string =>
  city?.split(',')[0]?.trim() ?? '';
