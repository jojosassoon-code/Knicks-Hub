import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sortStandings,
  updateHeadToHeadRecord,
  type HeadToHeadMap,
} from '../lib/standings.ts';

test('sortStandings uses head-to-head to break a two-team tie', () => {
  const headToHead: HeadToHeadMap = new Map();
  updateHeadToHeadRecord(headToHead, 'NYK', 'BOS');
  updateHeadToHeadRecord(headToHead, 'NYK', 'BOS');
  updateHeadToHeadRecord(headToHead, 'BOS', 'NYK');

  const sorted = sortStandings(
    [
      {
        teamAbbreviation: 'BOS',
        teamName: 'Boston Celtics',
        wins: 48,
        losses: 26,
        conferenceWins: 30,
        conferenceLosses: 18,
        pointDifferential: 320,
        last10Wins: 7,
        last10Losses: 3,
      },
      {
        teamAbbreviation: 'NYK',
        teamName: 'New York Knicks',
        wins: 48,
        losses: 26,
        conferenceWins: 30,
        conferenceLosses: 18,
        pointDifferential: 200,
        last10Wins: 6,
        last10Losses: 4,
      },
    ],
    headToHead,
  );

  assert.equal(sorted[0].teamAbbreviation, 'NYK');
});

test('sortStandings stays deterministic when earlier tie-breakers are equal', () => {
  const sorted = sortStandings(
    [
      {
        teamAbbreviation: 'MIA',
        teamName: 'Miami Heat',
        wins: 40,
        losses: 34,
        conferenceWins: 28,
        conferenceLosses: 20,
        pointDifferential: 20,
        last10Wins: 5,
        last10Losses: 5,
      },
      {
        teamAbbreviation: 'ORL',
        teamName: 'Orlando Magic',
        wins: 40,
        losses: 34,
        conferenceWins: 28,
        conferenceLosses: 20,
        pointDifferential: 20,
        last10Wins: 5,
        last10Losses: 5,
      },
    ],
    new Map(),
  );

  assert.deepEqual(
    sorted.map(team => team.teamAbbreviation),
    ['MIA', 'ORL'],
  );
});
