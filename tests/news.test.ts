import test from 'node:test';
import assert from 'node:assert/strict';
import { __newsTestUtils } from '../lib/news.ts';

test('curateArticles removes near-duplicate stories and keeps the stronger source', () => {
  const curated = __newsTestUtils.curateArticles([
    {
      title: 'Knicks injury update on Jalen Brunson before matchup with Bucks',
      description: 'ESPN reports Brunson is questionable entering tonight.',
      url: 'https://example.com/espn-story',
      source: { name: 'ESPN' },
      publishedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      image: 'https://example.com/image.jpg',
    },
    {
      title: 'New York Knicks injury update on Jalen Brunson before Bucks game',
      description: 'A duplicate-style story with lighter sourcing.',
      url: 'https://example.com/blog-story',
      source: { name: 'ClutchPoints' },
      publishedAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
      image: null,
    },
  ]);

  assert.equal(curated.length, 1);
  assert.equal(curated[0]?.source.name, 'ESPN');
  assert.equal(curated[0]?.tag, 'Injury');
});

test('summarize falls back to a short derived line when description is missing', () => {
  const summary = __newsTestUtils.summarize({
    title: 'Knicks rotation battle intensifies entering final week',
    description: '',
    tag: 'Rotation',
  });

  assert.match(summary, /roles, minutes, and lineup trust/i);
});

test('extractors pull useful signals from article html', () => {
  const html = `
    <html>
      <head>
        <meta property="og:description" content="Jalen Brunson remains questionable after missing practice." />
      </head>
      <body>
        <p>The Knicks are monitoring Jalen Brunson closely after he missed practice with ankle soreness.</p>
        <p>Tom Thibodeau said the team will evaluate him again before tipoff.</p>
      </body>
    </html>
  `;

  assert.match(__newsTestUtils.extractMetaDescription(html), /Brunson remains questionable/i);
  assert.match(__newsTestUtils.extractRelevantParagraphText(html), /missed practice/i);
});

test('buildTakeaways produces concise ranked bullets', () => {
  const takeaways = __newsTestUtils.buildTakeaways([
    {
      title: 'Knicks playoff race tightens after key win',
      description: 'New York improved its standing in the East.',
      url: 'https://example.com/1',
      source: { name: 'The Athletic' },
      publishedAt: new Date().toISOString(),
      image: null,
      summary: 'The Knicks improved their footing in the East playoff race.',
      deepSummary: 'The Knicks strengthened their playoff position with a result that affects East seeding.',
      whyItMatters: 'Seeding movement can change the Knicks matchup path and how much each remaining game matters.',
      tag: 'Playoffs',
      score: 75,
    },
    {
      title: 'Brunson injury status remains day to day',
      description: 'Availability is still uncertain before the next game.',
      url: 'https://example.com/2',
      source: { name: 'ESPN' },
      publishedAt: new Date().toISOString(),
      image: null,
      summary: 'Brunson remains day to day heading into the next Knicks game.',
      deepSummary: 'Brunson remains day to day, leaving the Knicks waiting on a core availability decision.',
      whyItMatters: 'A rotation-level injury update matters more when it affects one of the Knicks core pieces.',
      tag: 'Injury',
      score: 70,
    },
  ]);

  assert.equal(takeaways.length, 2);
  assert.match(takeaways[0] ?? '', /^Playoffs:/);
  assert.match(takeaways[1] ?? '', /^Injury:/);
});

test('buildBriefing turns top stories into a war room report with labeled bullets', () => {
  const briefing = __newsTestUtils.buildBriefing([
    {
      title: 'Knicks playoff race tightens after key win',
      description: 'New York improved its standing in the East.',
      url: 'https://example.com/1',
      source: { name: 'The Athletic' },
      publishedAt: new Date().toISOString(),
      image: null,
      summary: 'The Knicks improved their footing in the East playoff race.',
      deepSummary: 'The Knicks improved their playoff standing with a result that affects their likely first-round path.',
      whyItMatters: 'Seeding movement can change the Knicks matchup path and how much each remaining game matters.',
      tag: 'Playoffs',
      score: 75,
    },
    {
      title: 'Brunson injury status remains day to day',
      description: 'Availability is still uncertain before the next game.',
      url: 'https://example.com/2',
      source: { name: 'ESPN' },
      publishedAt: new Date().toISOString(),
      image: null,
      summary: 'Brunson remains day to day heading into the next Knicks game.',
      deepSummary: 'Brunson remains day to day, leaving the Knicks waiting on a core availability decision before the next game.',
      whyItMatters: 'A rotation-level injury update matters more when it affects one of the Knicks core pieces.',
      tag: 'Injury',
      score: 70,
    },
  ]);

  assert.ok(briefing);
  assert.equal(briefing?.basedOnCount, 2);
  assert.equal(briefing?.bullets.length, 2);
  assert.match(briefing?.bullets[0]?.label ?? '', /STANDINGS|INJURY/);
  assert.ok(briefing?.bullets[0]?.text.length ?? 0 > 10);
});
