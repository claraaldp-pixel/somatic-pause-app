import {
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const WEEK_OPTIONS = { weekStartsOn: 1 };

export function getCheckinDate(checkin) {
  const value = checkin?.date || checkin?.created_at;
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function getPeriodStart(range, date = new Date()) {
  return range === 'week'
    ? startOfWeek(date, WEEK_OPTIONS)
    : startOfMonth(date);
}

export function getPeriodKey(range, date = new Date()) {
  return format(getPeriodStart(range, date), 'yyyy-MM-dd');
}

export function formatPeriodLabel(range, date) {
  if (range === 'month') return format(startOfMonth(date), 'MMMM yyyy');

  const start = startOfWeek(date, WEEK_OPTIONS);
  const end = endOfWeek(date, WEEK_OPTIONS);
  const startLabel = format(start, start.getFullYear() === end.getFullYear() ? 'MMM d' : 'MMM d, yyyy');
  return `${startLabel} – ${format(end, 'MMM d, yyyy')}`;
}

export function buildPeriodOptions(checkins, range, now = new Date()) {
  if (range === 'all') return [];

  const currentKey = getPeriodKey(range, now);
  const keys = new Set([currentKey]);
  checkins.forEach((checkin) => {
    const date = getCheckinDate(checkin);
    if (date) keys.add(getPeriodKey(range, date));
  });

  return [...keys]
    .sort((a, b) => b.localeCompare(a))
    .map((value) => {
      const date = parseISO(value);
      const prefix = value === currentKey
        ? (range === 'week' ? 'This week · ' : 'This month · ')
        : '';
      return {
        value,
        label: `${prefix}${formatPeriodLabel(range, date)}`,
      };
    });
}

export function filterCheckinsByPeriod(checkins, range, periodKey) {
  if (range === 'all') return checkins;

  const anchor = parseISO(periodKey);
  if (!isValid(anchor)) return [];
  const interval = range === 'week'
    ? {
        start: startOfWeek(anchor, WEEK_OPTIONS),
        end: endOfWeek(anchor, WEEK_OPTIONS),
      }
    : {
        start: startOfMonth(anchor),
        end: endOfMonth(anchor),
      };

  return checkins.filter((checkin) => {
    const date = getCheckinDate(checkin);
    return date ? isWithinInterval(date, interval) : false;
  });
}
