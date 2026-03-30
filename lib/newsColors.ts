import type { NewsTag } from '@/lib/news';

export type TagStyle = { bg: string; text: string; border: string };

export const TAG_COLORS: Record<NewsTag, TagStyle> = {
  'Injury':       { bg: 'rgba(255,61,61,0.12)',    text: '#FF7070', border: 'rgba(255,61,61,0.3)'    },
  'Playoffs':     { bg: 'rgba(0,107,182,0.14)',    text: '#4DAAFF', border: 'rgba(0,107,182,0.32)'   },
  'Postgame':     { bg: 'rgba(136,153,170,0.12)',  text: '#9BAEBB', border: 'rgba(136,153,170,0.28)' },
  'Trade Buzz':   { bg: 'rgba(245,132,38,0.12)',   text: '#F58426', border: 'rgba(245,132,38,0.3)'   },
  'Off-Court':    { bg: 'rgba(167,139,250,0.12)',  text: '#A78BFA', border: 'rgba(167,139,250,0.28)' },
  'General':      { bg: 'rgba(100,116,139,0.12)',  text: '#94A3B8', border: 'rgba(100,116,139,0.25)' },
  'Rotation':     { bg: 'rgba(136,153,170,0.12)',  text: '#9BAEBB', border: 'rgba(136,153,170,0.28)' },
  'Game Preview': { bg: 'rgba(0,200,83,0.12)',     text: '#4ADE80', border: 'rgba(0,200,83,0.28)'    },
};
