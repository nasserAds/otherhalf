'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { AvatarBadge } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import { GAMES } from '@/lib/games';
import { getLevelInfo } from '@/lib/levels';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';
import type { PublicRoomSummary } from '@/types';

type View = 'all' | 'recent' | 'favorites' | 'friends';
type GameMeta = (typeof GAMES)[number];

const RECENT_KEY = 'otherhalf_recent_games';
const FAVORITES_KEY = 'otherhalf_favorite_games';

const folderStyles = [
  { body: 'from-[#b9e4d0] to-[#9bd2bb]', tab: '#9bd2bb' },
  { body: 'from-[#c9ddf2] to-[#a9cbe8]', tab: '#a9cbe8' },
  { body: 'from-[#e4d0f2] to-[#cdb2e7]', tab: '#cdb2e7' },
  { body: 'from-[#f4d7a3] to-[#edbd73]', tab: '#edbd73' },
];

function readStoredList(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
  } catch {
    return [];
  }
}

function ViewButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'flex min-h-11 items-center justify-center gap-2 rounded-[6px] border-2 border-[#29263a] px-3 text-xs font-black shadow-[2px_3px_0_#29263a] transition hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none ' +
        (active ? 'bg-[#e9ddff] text-[#7f5fca]' : 'bg-white')
      }
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function GameFolder({
  game,
  index,
  favorite,
  onFavorite,
  onOpen,
}: {
  game: GameMeta;
  index: number;
  favorite: boolean;
  onFavorite: (slug: string) => void;
  onOpen: (slug: string) => void;
}) {
  const style = folderStyles[index % folderStyles.length];

  return (
    <div className="group relative w-full">
      <div className="relative pt-4">
        <div
          className="absolute right-5 top-0 h-7 w-28 rounded-t-[8px] border-2 border-[#29263a] border-b-0"
          style={{ background: style.tab }}
        />

        <motion.div
          whileHover={{ y: -6, rotate: -0.5 }}
          whileTap={{ scale: 0.985 }}
          className={
            'relative min-h-[285px] overflow-hidden rounded-[10px] border-2 border-[#29263a] bg-gradient-to-br ' +
            style.body +
            ' px-5 pb-6 pt-9 shadow-[4px_6px_0_#29263a] transition-shadow duration-200 group-hover:shadow-[6px_10px_0_#29263a]'
          }
        >
          <button
            type="button"
            onClick={() => onFavorite(game.slug)}
            aria-label={favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            aria-pressed={favorite}
            className={
              'absolute left-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-[6px] border-2 border-[#29263a] bg-white/85 text-lg shadow-[1px_2px_0_rgba(41,38,58,.25)] backdrop-blur-sm transition hover:-translate-y-0.5 ' +
              (favorite ? 'text-[#8b73c9]' : 'text-[#8f8996]')
            }
          >
            {favorite ? '★' : '☆'}
          </button>

          <Link
            href={'/games/' + game.slug}
            onClick={() => onOpen(game.slug)}
            className="flex min-h-[230px] flex-col items-center justify-center text-center outline-none"
          >
            <div className="grid h-24 w-24 place-items-center rounded-[12px] border-2 border-[#29263a] bg-white/75 text-[#29263a] shadow-[2px_3px_0_rgba(41,38,58,.28)]">
              {game.slug === 'otherhalf' ? (
                <DebateMark />
              ) : (
                <span className="text-4xl font-black">{game.title.slice(0, 1)}</span>
              )}
            </div>

            <h3 className="mt-4 text-2xl font-black tracking-tight text-[#29263a]">{game.title}</h3>
            <p className="mt-1 max-w-[260px] text-xs font-bold text-[#29263a]/60">{game.tagline}</p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-[5px] border-2 border-[#29263a] bg-white px-4 py-2 text-xs font-black shadow-[2px_3px_0_#29263a]">
                افتح اللعبة ←
              </span>
              {game.players && (
                <span className="rounded-[5px] border border-[#29263a]/20 bg-white/60 px-2.5 py-1.5 text-[10px] font-bold text-[#29263a]/60">
                  {game.players}
                </span>
              )}
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function DebateMark() {
  return (
    <svg viewBox="0 0 96 96" className="h-14 w-14" aria-hidden="true">
      <path d="M16 18h28a10 10 0 0 1 10 10v12a10 10 0 0 1-10 10H29l-10 9v-9h-3V18Z" fill="#d8c7f0" stroke="#29263a" strokeWidth="4" />
      <path d="M52 46h20a10 10 0 0 1 10 10v8a10 10 0 0 1-10 10H62l-9 8v-8h-1V56a10 10 0 0 1 10-10Z" fill="#f6d69d" stroke="#29263a" strokeWidth="4" />
      <path d="M26 34h14M61 60h12" stroke="#29263a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export default function GamesHubPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { show } = useToast();

  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('all');
  const [recent, setRecent] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [joinBusy, setJoinBusy] = useState<string | null>(null);

  const levelInfo = getLevelInfo(user?.xp ?? 0);

  useEffect(() => {
    setRecent(readStoredList(RECENT_KEY));
    setFavorites(readStoredList(FAVORITES_KEY));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {}
  }, [recent, favorites]);

  useEffect(() => {
    if (!profileOpen && !menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [profileOpen, menuOpen]);

  useEffect(() => {
    if (view !== 'friends' || !accessToken) {
      setPublicRooms([]);
      return;
    }

    let cancelled = false;
    setRoomsLoading(true);

    api.listPublicRooms(accessToken)
      .then((rooms) => {
        if (!cancelled) setPublicRooms(rooms);
      })
      .catch(() => {
        if (!cancelled) setPublicRooms([]);
      })
      .finally(() => {
        if (!cancelled) setRoomsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, accessToken]);

  const markRecent = (slug: string) => {
    setRecent((current) => [slug, ...current.filter((item) => item !== slug)].slice(0, 12));
  };

  const toggleFavorite = (slug: string) => {
    setFavorites((current) => {
      const exists = current.includes(slug);
      show(exists ? 'أزلنا اللعبة من المفضلة' : 'أضفنا اللعبة إلى المفضلة ★');
      return exists ? current.filter((item) => item !== slug) : [slug, ...current];
    });
  };

  const setViewAndClearSearch = (nextView: View) => {
    setView(nextView);
    setSearch('');
  };

  const availableGames = useMemo(() => GAMES.filter((game) => !game.comingSoon), []);

  const games = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    let filtered = availableGames;

    if (view === 'recent') {
      filtered = availableGames.filter((game) => recent.includes(game.slug));
    }

    if (view === 'favorites') {
      filtered = availableGames.filter((game) => favorites.includes(game.slug));
    }

    if (!query) return filtered;

    return filtered.filter((game) =>
      (game.title + ' ' + game.tagline + ' ' + game.players).toLocaleLowerCase().includes(query),
    );
  }, [availableGames, favorites, recent, search, view]);

  const joinRoom = async (room: PublicRoomSummary) => {
    if (!accessToken) {
      show('سجّل الدخول أولًا للانضمام إلى غرفة');
      return;
    }

    setJoinBusy(room.code);

    try {
      await api.joinRoom(accessToken, room.code);
      window.location.href = '/room/' + encodeURIComponent(room.code);
    } catch {
      show('تعذر الانضمام إلى هذه الغرفة. جرّب غرفة أخرى.');
    } finally {
      setJoinBusy(null);
    }
  };

  return (
    <PageTransition wide>
      {(profileOpen || menuOpen) && (
        <button
          type="button"
          aria-label="إغلاق القوائم"
          className="fixed inset-0 z-30 cursor-default bg-transparent"
          onClick={() => {
            setProfileOpen(false);
            setMenuOpen(false);
          }}
        />
      )}

      <main dir="rtl" className="min-h-[calc(100dvh-28px)] bg-[#f8f5ee] text-[#29263a]">
        <div className="mx-auto w-full max-w-[1080px] px-1 pb-5 sm:px-2">
          <header className="relative flex flex-col gap-4 border-b-2 border-[#29263a]/15 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/menu" className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] border-2 border-[#29263a] bg-[#d8c7f0] text-xl font-black shadow-[2px_3px_0_#29263a]">
                O
              </div>
              <div className="min-w-0">
                <div className="truncate text-2xl font-black tracking-tight">OtherHalf</div>
                <div className="text-[11px] font-semibold text-[#6e6979]">منصة ألعاب مجتمعنا</div>
              </div>
            </Link>

            <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
              {user && (
                <div className="flex items-center gap-2 rounded-[6px] border-2 border-[#29263a] bg-white px-3 py-2 shadow-[2px_3px_0_#29263a]">
                  <span className="text-[10px] font-black text-[#7f5fca]">LV {levelInfo.level}</span>
                  <span className="text-[10px] font-bold text-[#8b8492]">{user.xp} XP</span>
                </div>
              )}

              <div className="relative z-40">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      window.location.href = '/login';
                      return;
                    }
                    setProfileOpen((value) => !value);
                    setMenuOpen(false);
                  }}
                  aria-label={user ? 'فتح الملف الشخصي' : 'تسجيل الدخول'}
                  aria-expanded={profileOpen}
                  className="grid h-11 w-11 place-items-center rounded-[7px] border-2 border-[#29263a] bg-[#f1d0bc] shadow-[2px_3px_0_#29263a] transition hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none"
                >
                  {user ? <AvatarBadge avatar={user.avatar} size="sm" /> : <span className="text-xs font-black">OH</span>}
                </button>

                <AnimatePresence>
                  {profileOpen && user && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.98 }}
                      className="absolute right-0 top-14 z-50 w-[min(310px,calc(100vw-32px))] rounded-[8px] border-2 border-[#29263a] bg-[#fffdf8] p-4 shadow-[4px_5px_0_#29263a]"
                    >
                      <div className="flex items-center gap-3">
                        <AvatarBadge avatar={user.avatar} size="md" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black">{user.username}</div>
                          <div className="text-[10px] font-semibold text-[#8b8492]">
                            المستوى {levelInfo.level} · {user.xp} XP · {user.coins} Coins
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-[#777182]">
                          <span>المستوى التالي {levelInfo.level + 1}</span>
                          <span>{levelInfo.progressXp}/750 XP</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full border border-[#29263a]/20 bg-[#ece7dc]">
                          <div className="h-full rounded-full bg-[#9b7ad8] transition-all" style={{ width: levelInfo.progressPercent + '%' }} />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2">
                        <Link href={'/profile/' + encodeURIComponent(user.username)} onClick={() => setProfileOpen(false)} className="rounded-[5px] border-2 border-[#29263a] bg-[#e9ddff] px-3 py-2.5 text-center text-xs font-black shadow-[2px_3px_0_#29263a]">
                          عرض الملف الشخصي
                        </Link>
                        <Link href="/avatar" onClick={() => setProfileOpen(false)} className="rounded-[5px] border-2 border-[#29263a] bg-white px-3 py-2.5 text-center text-xs font-black shadow-[2px_3px_0_#29263a]">
                          تغيير الصورة
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative z-40">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen((value) => !value);
                    setProfileOpen(false);
                  }}
                  aria-expanded={menuOpen}
                  className="flex min-h-11 items-center gap-2 rounded-[6px] border-2 border-[#29263a] bg-white px-4 py-2.5 text-sm font-black shadow-[2px_3px_0_#29263a] transition hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none"
                >
                  <span className="text-lg leading-none">☰</span>
                  القائمة
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.nav
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 top-14 z-50 w-[210px] rounded-[8px] border-2 border-[#29263a] bg-[#fffdf8] p-2 shadow-[4px_5px_0_#29263a]"
                    >
                      <Link href="/menu" onClick={() => setMenuOpen(false)} className="block rounded-[5px] bg-[#eee8ff] px-3 py-2.5 text-xs font-black">
                        🎮 الألعاب
                      </Link>
                      <Link href="/settings" onClick={() => setMenuOpen(false)} className="block rounded-[5px] px-3 py-2.5 text-xs font-black hover:bg-[#eee8ff]">
                        ⚙ الإعدادات
                      </Link>
                      <Link href="/about" onClick={() => setMenuOpen(false)} className="block rounded-[5px] px-3 py-2.5 text-xs font-black hover:bg-[#eee8ff]">
                        ⓘ من نحن
                      </Link>
                      <Link href="/avatar" onClick={() => setMenuOpen(false)} className="block rounded-[5px] px-3 py-2.5 text-xs font-black hover:bg-[#eee8ff]">
                        ✦ تغيير الصورة
                      </Link>
                    </motion.nav>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <section className="mt-8 max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b73c9]">Your playground</p>
            <h1 className="mt-2 text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-[0.96] tracking-[-0.05em]">
              ماذا ستلعب اليوم؟
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-[#777182]">
              OtherHalf هي منصة ألعاب متعددة. كل لعبة لها مجلدها الخاص، والمناظرات هي مجرد البداية.
            </p>
          </section>

          <label className="mt-7 flex min-h-12 items-center gap-3 rounded-[7px] border-2 border-[#29263a] bg-white px-4 shadow-[2px_3px_0_#29263a]">
            <span className="text-xl text-[#8e879b]">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث عن لعبة"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#9a94a2]"
              aria-label="البحث عن لعبة"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[5px] border border-[#29263a]/20 text-sm font-black"
                aria-label="مسح البحث"
              >
                ×
              </button>
            )}
          </label>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <ViewButton icon="⌂" label="كل الألعاب" active={view === 'all'} onClick={() => setViewAndClearSearch('all')} />
            <ViewButton icon="◷" label="آخر ما لعبت" active={view === 'recent'} onClick={() => setViewAndClearSearch('recent')} />
            <ViewButton icon="♡" label="المفضلة" active={view === 'favorites'} onClick={() => setViewAndClearSearch('favorites')} />
            <ViewButton icon="•" label="مع الأصدقاء" active={view === 'friends'} onClick={() => setViewAndClearSearch('friends')} />
          </div>

          <AnimatePresence mode="wait">
            {view === 'friends' ? (
              <motion.section
                key="friends"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8"
              >
                <div className="flex flex-col gap-4 rounded-[8px] border-2 border-[#29263a] bg-[#e8ddff] p-5 shadow-[2px_4px_0_#29263a] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8666c8]">Play together</p>
                    <h2 className="mt-1 text-2xl font-black">العب مع أصدقائك</h2>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#777182]">أنشئ غرفة أو ادخل إلى غرفة موجودة وابدأ اللعب.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href="/room/create" className="rounded-[5px] border-2 border-[#29263a] bg-white px-4 py-2.5 text-xs font-black shadow-[2px_3px_0_#29263a]">
                      ＋ إنشاء غرفة
                    </Link>
                    <Link href="/room/join" className="rounded-[5px] border-2 border-[#29263a] bg-[#f6d69d] px-4 py-2.5 text-xs font-black shadow-[2px_3px_0_#29263a]">
                      ↗ الانضمام
                    </Link>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-black">الغرف العامة</h2>
                      <p className="mt-1 text-xs font-semibold text-[#8b8492]">غرف مفتوحة يمكن الانضمام إليها الآن.</p>
                    </div>
                    <button
                      type="button"
                      disabled={roomsLoading}
                      onClick={() => {
                        if (!accessToken) {
                          show('سجّل الدخول لرؤية الغرف العامة');
                          return;
                        }
                        setView('friends');
                        setPublicRooms([]);
                        setRoomsLoading(true);
                        api.listPublicRooms(accessToken)
                          .then(setPublicRooms)
                          .catch(() => show('تعذر تحديث الغرف الآن.'))
                          .finally(() => setRoomsLoading(false));
                      }}
                      className="rounded-[5px] border-2 border-[#29263a] bg-white px-3 py-2 text-[10px] font-black shadow-[2px_3px_0_#29263a] disabled:opacity-50"
                    >
                      {roomsLoading ? 'جارٍ التحديث...' : 'تحديث الغرف'}
                    </button>
                  </div>

                  {!accessToken ? (
                    <div className="mt-4 rounded-[8px] border-2 border-dashed border-[#29263a]/40 bg-white p-6 text-center">
                      <p className="text-sm font-black">سجّل الدخول لرؤية الغرف العامة</p>
                      <Link href="/login" className="mt-4 inline-flex rounded-[5px] border-2 border-[#29263a] bg-[#e9ddff] px-4 py-2 text-xs font-black shadow-[2px_3px_0_#29263a]">
                        تسجيل الدخول
                      </Link>
                    </div>
                  ) : publicRooms.length === 0 ? (
                    <div className="mt-4 rounded-[8px] border-2 border-dashed border-[#29263a]/40 bg-white p-6 text-center">
                      <div className="text-2xl">◌</div>
                      <p className="mt-1 text-sm font-black">لا توجد غرف عامة متاحة الآن</p>
                      <p className="mt-1 text-xs font-semibold text-[#8b8492]">أنشئ غرفة وادعُ أصدقاءك.</p>
                      <Link href="/room/create" className="mt-4 inline-flex rounded-[5px] border-2 border-[#29263a] bg-[#b9e4d0] px-4 py-2 text-xs font-black shadow-[2px_3px_0_#29263a]">
                        ＋ إنشاء غرفة
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {publicRooms.map((room) => (
                        <div key={room.id} className="rounded-[7px] border-2 border-[#29263a] bg-white p-4 shadow-[2px_3px_0_#29263a]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-black">{room.host.username}</div>
                              <div className="mt-1 text-[10px] font-semibold text-[#8b8492]">
                                {room._count.players}/{room.maxPlayers} لاعبين · {room.debateMode}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-[5px] bg-[#eee8ff] px-2 py-1 text-[9px] font-black">{room.code}</span>
                          </div>
                          <button
                            type="button"
                            disabled={joinBusy === room.code}
                            onClick={() => joinRoom(room)}
                            className="mt-4 w-full rounded-[5px] border-2 border-[#29263a] bg-[#e9ddff] px-3 py-2.5 text-xs font-black shadow-[2px_3px_0_#29263a] disabled:opacity-60"
                          >
                            {joinBusy === room.code ? 'جارٍ الانضمام...' : 'انضم إلى الغرفة ←'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.section>
            ) : (
              <motion.section
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-10"
              >
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black">
                      {view === 'recent' ? 'آخر ما لعبت' : view === 'favorites' ? 'المفضلة' : 'ألعابك'}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-[#8b8492]">
                      {view === 'recent'
                        ? 'الألعاب التي فتحتها مؤخرًا.'
                        : view === 'favorites'
                          ? 'ألعابك المحفوظة لوقت آخر.'
                          : 'كل لعبة جديدة ستظهر كمجلد مستقل.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#8b8492]">{games.length} لعبة</span>
                </div>

                {games.length > 0 ? (
                  <div className="mt-7 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                    {games.map((game, index) => (
                      <GameFolder
                        key={game.slug}
                        game={game}
                        index={index}
                        favorite={favorites.includes(game.slug)}
                        onFavorite={toggleFavorite}
                        onOpen={markRecent}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mx-auto mt-7 max-w-[430px] rounded-[8px] border-2 border-dashed border-[#29263a]/40 bg-white p-7 text-center shadow-[2px_3px_0_#29263a]">
                    <div className="text-3xl">{search ? '⌕' : view === 'favorites' ? '☆' : '◷'}</div>
                    <h3 className="mt-2 text-base font-black">
                      {search ? 'لم نجد لعبة مطابقة' : view === 'favorites' ? 'لا توجد ألعاب مفضلة' : 'لا توجد ألعاب لعبتها بعد'}
                    </h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#8b8492]">
                      {search ? 'جرّب كلمة بحث مختلفة.' : 'افتح اللعبة أولًا وستظهر هنا تلقائيًا.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setView('all');
                        setSearch('');
                      }}
                      className="mt-4 rounded-[5px] border-2 border-[#29263a] bg-[#b9e4d0] px-4 py-2.5 text-xs font-black shadow-[2px_3px_0_#29263a]"
                    >
                      عرض كل الألعاب
                    </button>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {view !== 'friends' && (
            <section className="mt-10 rounded-[8px] border-2 border-dashed border-[#29263a]/40 bg-[#fffdf8] p-6 text-center shadow-[2px_3px_0_#29263a]">
              <div className="text-2xl">✦</div>
              <h2 className="mt-1 text-xl font-black">ألعاب أكثر قادمة</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#8b8492]">
                OtherHalf منصة متعددة الألعاب. عندما نضيف لعبة جديدة، ستظهر هنا كمجلد مستقل.
              </p>
            </section>
          )}

          <footer className="mt-8 flex flex-col gap-3 border-t-2 border-[#29263a]/15 pt-5 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Link href="/settings" className="rounded-[5px] border-2 border-[#29263a] bg-white px-3 py-2 text-xs font-black shadow-[2px_3px_0_#29263a]">
                ⚙ الإعدادات
              </Link>
              <Link href="/about" className="rounded-[5px] border-2 border-[#29263a] bg-white px-3 py-2 text-xs font-black shadow-[2px_3px_0_#29263a]">
                ⓘ من نحن
              </Link>
            </div>
            <div className="text-[10px] font-black text-[#a19aa7]">OtherHalf • ألعابنا، مجتمعنا</div>
          </footer>
        </div>
      </main>
    </PageTransition>
  );
}
