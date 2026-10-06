import {
  buildPeriodOptions,
  filterCheckinsByPeriod,
  formatPeriodLabel,
  getCheckinDate,
  getPeriodKey,
} from '@/lib/progressPeriods';

const checkins = [
  { id: 'today', date: '2026-10-06' },
  { id: 'last-week', date: '2026-09-30' },
  { id: 'historic', date: '2026-05-14' },
  { id: 'fallback', date: null, created_at: '2026-05-22T10:00:00Z' },
];

describe('progress period helpers', () => {
  it('filters a selected week inclusively from Monday through Sunday', () => {
    expect(filterCheckinsByPeriod(checkins, 'week', '2026-10-05').map(({ id }) => id))
      .toEqual(['today']);
    expect(filterCheckinsByPeriod(checkins, 'week', '2026-09-28').map(({ id }) => id))
      .toEqual(['last-week']);
  });

  it('filters a selected historical month', () => {
    expect(filterCheckinsByPeriod(checkins, 'month', '2026-05-01').map(({ id }) => id))
      .toEqual(['historic', 'fallback']);
  });

  it('uses created_at only when a completion date is missing', () => {
    expect(getCheckinDate(checkins[3])).toEqual(new Date('2026-05-22T10:00:00Z'));
  });

  it('builds selectable recorded periods and includes the current period', () => {
    const options = buildPeriodOptions(checkins, 'month', new Date('2026-10-06T12:00:00'));
    expect(options.map(({ value }) => value)).toEqual([
      '2026-10-01',
      '2026-09-01',
      '2026-05-01',
    ]);
    expect(options[0].label).toContain('This month');
  });

  it('formats stable week and month labels', () => {
    expect(getPeriodKey('week', new Date('2026-10-06T12:00:00'))).toBe('2026-10-05');
    expect(formatPeriodLabel('week', new Date('2026-10-05T12:00:00')))
      .toBe('Oct 5 – Oct 11, 2026');
    expect(formatPeriodLabel('month', new Date('2026-05-14T12:00:00')))
      .toBe('May 2026');
  });
});
