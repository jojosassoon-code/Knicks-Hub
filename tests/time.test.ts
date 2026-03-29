import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTipoffTime,
  getRelativeDayLabel,
  getTodayInNewYork,
} from '../lib/time.ts';

test('getTodayInNewYork uses New York date instead of UTC date slicing', () => {
  assert.equal(
    getTodayInNewYork('2026-03-30T02:30:00Z'),
    '2026-03-29',
  );
});

test('formatTipoffTime preserves valid evening Eastern tipoffs', () => {
  assert.equal(
    formatTipoffTime('2026-04-01T00:00:00Z'),
    '8:00 PM EDT',
  );
});

test('getRelativeDayLabel resolves today and tomorrow in New York', () => {
  assert.equal(
    getRelativeDayLabel('2026-03-29', '2026-03-29T16:00:00Z'),
    'TODAY',
  );
  assert.equal(
    getRelativeDayLabel('2026-03-30', '2026-03-29T16:00:00Z'),
    'TOMORROW',
  );
});
