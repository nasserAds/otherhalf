export interface GameMeta {
  slug: string;
  title: string;
  tagline: string;
  players: string; // e.g. "4–12 لاعبين", blank for coming-soon entries
  comingSoon?: boolean;
}

// Add future games here — the hub (app/menu) and the per-game landing route
// (app/games/[slug]) both read from this list, so nothing else needs to
// change to add a new title beyond building its own /games/<slug> screen.
export const GAMES: GameMeta[] = [
  {
    slug: 'debate-game',
    title: 'Debate Game',
    tagline: 'مناظرات جماعية مباشرة أمام الجمهور',
    players: '4–12 لاعبين',
  },
  {
    slug: 'coming-soon-1',
    title: '؟؟؟',
    tagline: 'لعبة جديدة قريبًا',
    players: '',
    comingSoon: true,
  },
  {
    slug: 'coming-soon-2',
    title: '؟؟؟',
    tagline: 'لعبة جديدة قريبًا',
    players: '',
    comingSoon: true,
  },
];

export function getGame(slug: string): GameMeta | undefined {
  return GAMES.find((g) => g.slug === slug);
}
