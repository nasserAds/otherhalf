'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/ui/PageTransition';
import { AvatarBadge } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { GAMES } from '@/lib/games';
import { getLevelInfo } from '@/lib/levels';

type FolderGame = (typeof GAMES)[number];

const folderStyles = [
  { body: 'from-[#b9e4d0] to-[#9bd2bb]', tab: '#9bd2bb', icon: '⚖' },
  { body: 'from-[#c9ddf2] to-[#a9cbe8]', tab: '#a9cbe8', icon: '✦' },
  { body: 'from-[#e4d0f2] to-[#cdb2e7]', tab: '#cdb2e7', icon: '◈' },
  { body: 'from-[#f4d7a3] to-[#edbd73]', tab: '#edbd73', icon: '★' },
];

function GameFolder({ game, index }: { game: FolderGame; index: number }) {
  const style = folderStyles[index % folderStyles.length];
  return (
    <Link href={`/games/${game.slug}`} className="group mx-auto block w-full max-w-[330px]">
      <div className="relative pt-4">
        <div className="absolute right-4 top-0 h-7 w-28 rounded-t-[8px] border-2 border-[#29263a] border-b-0" style={{ background: style.tab }} />
        <motion.div whileHover={{ y: -6, rotate: -0.6 }} whileTap={{ scale: 0.985 }} className={`relative min-h-[275px] overflow-hidden rounded-[10px] border-2 border-[#29263a] bg-gradient-to-br ${style.body} px-5 pb-6 pt-9 shadow-[4px_6px_0_#29263a] transition-shadow group-hover:shadow-[6px_10px_0_#29263a]`}>
          <div className="absolute left-4 top-4 text-[9px] font-black uppercase tracking-[0.14em] text-[#29263a]/45">GAME FOLDER</div>
          <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
            <div className="grid h-24 w-24 place-items-center rounded-[12px] border-2 border-[#29263a] bg-white/75 text-5xl text-[#29263a] shadow-[2px_3px_0_rgba(41,38,58,.28)]">{style.icon}</div>
            <h3 className="mt-4 text-2xl font-black tracking-tight text-[#29263a]">{game.title}</h3>
            <p className="mt-1 text-xs font-bold text-[#29263a]/60">{game.tagline}</p>
            <span className="mt-5 rounded-[5px] border-2 border-[#29263a] bg-white px-4 py-2 text-xs font-black shadow-[2px_3px_0_#29263a]">افتح اللعبة ←</span>
          </div>
        </motion.div>
      </div>
    </Link>
  );
}

export default function GamesHubPage() {
  const user = useAuthStore((s) => s.user);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const levelInfo = getLevelInfo(user?.xp ?? 0);

  const games = useMemo(() => {
    const available = GAMES.filter((game) => !game.comingSoon);
    const query = search.trim().toLocaleLowerCase();
    return query ? available.filter((game) => `${game.title} ${game.tagline}`.toLocaleLowerCase().includes(query)) : available;
  }, [search]);

  return (
    <PageTransition>
      <main dir="rtl" className="min-h-[100dvh] -mx-4 -my-5 bg-[#f8f5ee] px-4 py-5 text-[#29263a] sm:-mx-6 sm:-my-6 sm:px-7 sm:py-7 md:-mx-8 md:-my-8 md:px-10 md:py-9">
        <div className="mx-auto max-w-5xl">
          <header className="relative flex items-start justify-between gap-4">
            <Link href="/menu" className="flex items-center gap-3" aria-label="OtherHalf">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] border-2 border-[#29263a] bg-[#d8c7f0] text-xl shadow-[2px_3px_0_#29263a]">O</div>
              <div><div className="text-2xl font-black tracking-tight">OtherHalf</div><div className="text-[11px] font-semibold text-[#6e6979]">ملعب مجتمعنا</div></div>
            </Link>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button type="button" onClick={() => { setProfileOpen((value) => !value); setMenuOpen(false); }} className="grid h-11 w-11 place-items-center rounded-[7px] border-2 border-[#29263a] bg-[#f1d0bc] shadow-[2px_3px_0_#29263a] transition hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none" aria-label="فتح الملف الشخصي" aria-expanded={profileOpen}>
                  {user ? <AvatarBadge avatar={user.avatar} size="sm" /> : <span className="text-xs font-black">OH</span>}
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} className="absolute left-0 top-14 z-40 w-[275px] rounded-[8px] border-2 border-[#29263a] bg-[#fffdf8] p-4 shadow-[4px_5px_0_#29263a]">
                      {user ? (
                        <>
                          <div className="flex items-center gap-3"><AvatarBadge avatar={user.avatar} size="md" /><div className="min-w-0"><div className="truncate text-sm font-black">{user.username}</div><div className="text-[10px] font-semibold text-[#8b8492]">المستوى {levelInfo.level} · {user.xp} XP · {user.coins} Coins</div></div></div>
                          <div className="mt-4"><div className="mb-1 flex items-center justify-between text-[10px] font-bold text-[#777182]"><span>التقدم للمستوى {levelInfo.level + 1}</span><span>{levelInfo.progressXp}/750 XP</span></div><div className="h-2 overflow-hidden rounded-full border border-[#29263a]/20 bg-[#ece7dc]"><div className="h-full rounded-full bg-[#9b7ad8] transition-all" style={{ width: `${levelInfo.progressPercent}%` }} /></div></div>
                          <div className="mt-4 grid gap-2"><Link href={`/profile/${encodeURIComponent(user.username)}`} onClick={() => setProfileOpen(false)} className="rounded-[5px] border-2 border-[#29263a] bg-[#e9ddff] px-3 py-2.5 text-center text-xs font-black shadow-[2px_3px_0_#29263a]">عرض الملف الشخصي</Link><Link href="/settings" onClick={() => setProfileOpen(false)} className="rounded-[5px] border-2 border-[#29263a] bg-white px-3 py-2.5 text-center text-xs font-black shadow-[2px_3px_0_#29263a]">الإعدادات</Link></div>
                        </>
                      ) : <Link href="/login" className="block rounded-[5px] border-2 border-[#29263a] bg-[#e9ddff] px-3 py-2.5 text-center text-xs font-black shadow-[2px_3px_0_#29263a]">تسجيل الدخول</Link>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button type="button" onClick={() => { setMenuOpen((value) => !value); setProfileOpen(false); }} className="flex items-center gap-2 rounded-[6px] border-2 border-[#29263a] bg-white px-4 py-2.5 text-sm font-black shadow-[2px_3px_0_#29263a] transition hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none" aria-expanded={menuOpen}><span className="text-lg leading-none">☰</span> القائمة</button>
                <AnimatePresence>{menuOpen && <motion.nav initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute left-0 top-14 z-40 w-48 rounded-[8px] border-2 border-[#29263a] bg-[#fffdf8] p-2 shadow-[4px_5px_0_#29263a]"><Link href="/settings" onClick={() => setMenuOpen(false)} className="block rounded-[5px] px-3 py-2.5 text-xs font-black hover:bg-[#eee8ff]">⚙ الإعدادات</Link><Link href="/about" onClick={() => setMenuOpen(false)} className="block rounded-[5px] px-3 py-2.5 text-xs font-black hover:bg-[#eee8ff]">ⓘ من نحن</Link><Link href="/avatar" onClick={() => setMenuOpen(false)} className="block rounded-[5px] px-3 py-2.5 text-xs font-black hover:bg-[#eee8ff]">✦ تغيير الصورة</Link></motion.nav>}</AnimatePresence>
              </div>
            </div>
          </header>

          <section className="mt-10"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b73c9]">ملعبك</p><h1 className="mt-2 max-w-2xl text-[38px] font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">أهلًا بك. ماذا ستلعب اليوم؟</h1><p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#777182]">عالم من الألعاب داخل مجلدات بسيطة. المناظرات مجرد البداية — ألعاب أكثر قادمة إلى مجتمع OtherHalf.</p><p className="mt-2 text-xs font-semibold text-[#5e9d7d]">● العب مباشرة من المتصفح.</p></section>

          <label className="mt-7 flex h-12 items-center gap-3 rounded-[7px] border-2 border-[#29263a] bg-white px-4 shadow-[2px_3px_0_#29263a]"><span className="text-xl text-[#8e879b]">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن لعبة" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#9a94a2]" /></label>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">{[['⌂', 'كل الألعاب'], ['◷', 'آخر ما لعبت'], ['♡', 'المفضلة'], ['•', 'مع الأصدقاء']].map(([icon, label], i) => <button key={label} type="button" className={`flex h-11 items-center justify-center gap-2 rounded-[6px] border-2 border-[#29263a] px-3 text-xs font-black shadow-[2px_3px_0_#29263a] transition active:translate-y-[2px] active:shadow-none ${i === 0 ? 'bg-[#e9ddff] text-[#7f5fca]' : 'bg-white'}`}><span className="text-base">{icon}</span>{label}</button>)}</div>

          <section className="mt-10"><div className="flex items-end justify-between"><div><h2 className="text-xl font-black">ألعابك</h2><p className="mt-1 text-xs font-semibold text-[#8b8492]">كل لعبة لها مجلدها الخاص.</p></div><span className="text-[10px] font-bold text-[#8b8492]">{games.length} لعبة</span></div><div className="mt-7 grid gap-8 sm:grid-cols-2">{games.map((game, index) => <GameFolder key={game.slug} game={game} index={index} />)}</div>{games.length === 0 && <div className="mx-auto mt-7 max-w-[330px] rounded-[8px] border-2 border-[#29263a] border-dashed bg-[#fffdf8] p-6 text-center shadow-[2px_3px_0_#29263a]"><div className="text-2xl">⌕</div><h3 className="mt-1 text-base font-black">لم نجد لعبة</h3><p className="mt-1 text-xs font-semibold text-[#8b8492]">جرّب كلمة بحث مختلفة.</p></div>}<div className="mx-auto mt-8 max-w-[680px] rounded-[8px] border-2 border-[#29263a] border-dashed bg-[#fffdf8] p-5 text-center shadow-[2px_3px_0_#29263a]"><div className="text-2xl">✦</div><h3 className="mt-1 text-base font-black">ألعاب أكثر قادمة</h3><p className="mt-1 text-xs font-semibold leading-5 text-[#8b8492]">OtherHalf ليست لعبة واحدة. كل لعبة جديدة ستظهر كمجلد مستقل داخل الملعب.</p></div></section>

          <section className="mt-10"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8492]">مجموعاتك</span><button type="button" className="text-2xl leading-none" aria-label="إضافة مجموعة">＋</button></div><div className="space-y-2.5">{[['آخر ما لعبت', '0', '#b69de5'], ['المفضلة', '0', '#86bca7'], ['مع الأصدقاء', '0', '#e8b56d']].map(([name, count, dot]) => <button key={name} type="button" className="flex h-12 w-full items-center gap-3 rounded-[6px] border-2 border-[#29263a] bg-white px-3.5 text-right shadow-[2px_3px_0_#29263a] transition hover:-translate-y-0.5"><span className="h-2 w-2 rounded-full" style={{ background: dot }} /><span className="text-xs font-black">{name}</span><span className="mr-auto text-xs font-bold text-[#8b8492]">{count}</span><span className="text-lg">←</span></button>)}</div></section>

          <section className="relative mt-8 overflow-hidden rounded-[8px] border-2 border-[#29263a] bg-[#e8ddff] p-6 shadow-[2px_4px_0_#29263a]"><div className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 rotate-[-2deg] border border-[#d5bd78] bg-[#f5e5a9] opacity-80" /><div className="text-2xl">✧</div><h2 className="mt-1 text-2xl font-black">من نحن؟</h2><p className="mt-1 max-w-xl text-xs font-semibold leading-5 text-[#777182]">OtherHalf مشروع صنعه Nasser و Rim من أجل مجتمعنا — مساحة نجمع فيها الألعاب، المنافسة، واللحظات الممتعة.</p><Link href="/about" className="mt-5 inline-flex items-center gap-2 rounded-[5px] border-2 border-[#29263a] bg-white px-4 py-2.5 text-xs font-black shadow-[2px_3px_0_#29263a]">اقرأ قصتنا ←</Link></section>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 pb-5"><div className="flex items-center gap-2"><Link href="/settings" className="rounded-[5px] border-2 border-[#29263a] bg-white px-3 py-2 text-xs font-black shadow-[2px_3px_0_#29263a]">⚙ الإعدادات</Link><Link href="/about" className="rounded-[5px] border-2 border-[#29263a] bg-white px-3 py-2 text-xs font-black shadow-[2px_3px_0_#29263a]">ⓘ من نحن</Link></div><div className="text-[10px] font-bold text-[#a19aa7]">OtherHalf • مجتمعنا، ألعابنا</div></footer>
        </div>
      </main>
    </PageTransition>
  );
}
