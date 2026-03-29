const NEW_YORK_TIME_ZONE = 'America/New_York';

type DateInput = Date | string;

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

function getDateParts(input: DateInput, timeZone = NEW_YORK_TIME_ZONE): DateParts {
  const date = toDate(input);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const read = (type: 'year' | 'month' | 'day') =>
    Number(parts.find(part => part.type === type)?.value ?? 0);

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
  };
}

export function getTodayInNewYork(input: DateInput = new Date()): string {
  const { year, month, day } = getDateParts(input);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function compareDateKeys(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function getRelativeDayLabel(
  dateKey: string,
  input: DateInput = new Date(),
): 'TODAY' | 'TOMORROW' | null {
  const today = getTodayInNewYork(input);
  if (dateKey === today) return 'TODAY';

  const tomorrow = new Date(toDate(input));
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  return dateKey === getTodayInNewYork(tomorrow) ? 'TOMORROW' : null;
}

export function formatCalendarDate(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  },
  timeZone = NEW_YORK_TIME_ZONE,
): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    ...options,
  }).format(date);
}

export function formatTipoffTime(
  datetime: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  },
  timeZone = NEW_YORK_TIME_ZONE,
): string | null {
  if (!datetime) return null;

  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    ...options,
  }).format(date);
}

export function formatUpdatedAt(
  datetime: string,
  timeZone = NEW_YORK_TIME_ZONE,
): string {
  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) return 'Updated recently';

  return `Updated ${new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)}`;
}

export { NEW_YORK_TIME_ZONE };
