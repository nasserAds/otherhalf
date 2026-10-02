'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const apps = [
  { href: '/menu', label: 'Games', icon: '🎮', hint: 'Game Center' },
  { href: '/profile', label: 'Profile', icon: '👤', hint: 'Your identity' },
  { href: '/settings', label: 'Settings', icon: '⚙️', hint: 'Preferences' },
  { href: '/avatar', label: 'Avatar', icon: '🧩', hint: 'Customize' },
];

const systemLinks = [
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Register' },
  { href: '/room', label: 'Room' },
  { href: '/admin', label: 'Admin' },
];

export default function DesignTestPage() {
  return (
    <main className="min-h-[100dvh] bg-[#eef1f5] text-[#20242b] p-3 sm:p-6 md:p-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-black/10 bg-[#f8f9fb] shadow-[0_30px_90px_rgba(20,30,45,0.16)]">
        <div className="flex h-11 items-center gap-2 border-b border-black/10 bg-white/80 px-4 backdrop-blur-xl">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="mx-auto text-[12px] font-semibold text-black/45">OtherHalf — Design Lab</span>
          <span className="hidden text-[11px] text-black/35 sm:block">⌘K</span>
        </div>

        <div className="grid min-h-[760px] md:grid-cols-[210px_1fr]">
          <aside className="border-b border-black/10 bg-[#f1f3f6]/90 p-4 md:border-b-0 md:border-r">
            <div className="mb-7 flex items-center gap-2 px-2">
              <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#20242b] text-sm text-white shadow-sm">O</div>
              <div>
                <p className="text-sm font-black tracking-tight">OtherHalf</p>
                <p className="text-[10px] text-black/40">Debate Studio</p>
              </div>
            </div>

            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">Favorites</p>
            <nav className="space-y-1">
              {apps.map((app, index) => (
                <Link
                  key={app.href}
                  href={app.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-white hover:shadow-sm ${index === 0 ? 'bg-white shadow-sm' : ''}`}
                >
                  <span className="text-base">{app.icon}</span>
                  <span className="font-semibold">{app.label}</span>
                </Link>
              ))}
            </nav>

            <p className="mt-7 px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">System</p>
            <nav className="space-y-1">
              {systemLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-xs font-semibold text-black/55 transition hover:bg-white hover:text-black">
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="relative overflow-hidden bg-[#fbfbfc] p-5 sm:p-8 md:p-10">
            <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#dce7ff] blur-3xl opacity-60" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#ffe6c9] blur-3xl opacity-60" />

            <div className="relative">
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <span className="mb-2 inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black/45 shadow-sm">
                    Design Test Page
                  </span>
                  <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-5xl">Your debate desk.</h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-black/50">
                    واجهة مستوحاة من macOS: نظيفة، هادئة، ورقية، حديثة، ومصممة لتكون مريحة على الهاتف والكمبيوتر.
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-right shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-black/35">Today</p>
                  <p className="mt-1 text-sm font-bold">Ready to debate</p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_18px_45px_rgba(30,40,55,0.08)] sm:p-6"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-black/35">Games</p>
                      <h2 className="text-xl font-black tracking-tight">Your games</h2>
                    </div>
                    <span className="rounded-full bg-[#f0f1f3] px-3 py-1 text-[10px] font-bold text-black/45">1 installed</span>
                  </div>

                  <Link href="/games/otherhalf" className="group block">
                    <div className="relative mx-auto max-w-[430px]">
                      <div className="absolute -top-2 left-4 z-10 h-7 w-28 rounded-t-[10px] bg-[#d7dde6] shadow-sm" />
                      <div className="relative overflow-hidden rounded-[18px] rounded-tl-[8px] border border-black/10 bg-gradient-to-br from-[#f9fbff] via-[#eef3fb] to-[#dfe8f5] p-5 pt-7 shadow-[0_22px_35px_rgba(65,85,110,0.16)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_28px_50px_rgba(65,85,110,0.22)]">
                        <div className="absolute right-5 top-5 rounded-full border border-black/10 bg-white/75 px-2.5 py-1 text-[9px] font-bold backdrop-blur">
                          OPEN
                        </div>
                        <div className="flex min-h-[230px] flex-col items-center justify-center">
                          <div className="mb-5 grid h-24 w-24 place-items-center rounded-[26px] border border-black/10 bg-white text-5xl shadow-[0_14px_30px_rgba(50,65,85,0.12)]">
                            ⚖️
                          </div>
                          <h3 className="text-2xl font-black tracking-[-0.04em]">OtherHalf</h3>
                          <p className="mt-1 text-xs font-medium text-black/45">The multiplayer debate game</p>
                          <span className="mt-5 rounded-full bg-[#20242b] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition group-hover:bg-black">
                            Open Game →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>

                <div className="space-y-5">
                  <div className="rounded-[24px] border border-black/10 bg-[#20242b] p-5 text-white shadow-[0_18px_45px_rgba(20,25,32,0.18)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Player</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl text-black shadow-sm">🦁</div>
                      <div>
                        <p className="font-black">Your profile</p>
                        <p className="text-xs text-white/45">XP 1,240 · 320 coins</p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <Link href="/profile" className="rounded-xl bg-white/10 px-3 py-2.5 text-center text-xs font-bold transition hover:bg-white/15">Profile</Link>
                      <Link href="/settings" className="rounded-xl bg-white/10 px-3 py-2.5 text-center text-xs font-bold transition hover:bg-white/15">Settings</Link>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">Quick actions</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link href="/games/otherhalf" className="rounded-2xl border border-black/10 bg-[#f6f7f9] p-3 text-center text-xs font-bold transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">⚡ Play</Link>
                      <Link href="/avatar" className="rounded-2xl border border-black/10 bg-[#f6f7f9] p-3 text-center text-xs font-bold transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">🧩 Avatar</Link>
                      <Link href="/login" className="rounded-2xl border border-black/10 bg-[#f6f7f9] p-3 text-center text-xs font-bold transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">↪ Login</Link>
                      <Link href="/register" className="rounded-2xl border border-black/10 bg-[#f6f7f9] p-3 text-center text-xs font-bold transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">＋ Register</Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[22px] border border-black/10 bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">Navigation</span>
                  {systemLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="rounded-full border border-black/10 bg-[#f5f6f8] px-3 py-1.5 text-[11px] font-semibold text-black/60 transition hover:bg-white hover:text-black">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-center border-t border-black/10 bg-white/70 p-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 rounded-[18px] border border-black/10 bg-white px-3 py-2 shadow-[0_8px_25px_rgba(20,30,45,0.10)]">
            {['🎮', '👤', '⚙️', '🧩', '⚖️'].map((icon, i) => (
              <Link key={i} href={i === 0 ? '/menu' : i === 1 ? '/profile' : i === 2 ? '/settings' : i === 3 ? '/avatar' : '/games/otherhalf'} className="grid h-10 w-10 place-items-center rounded-xl text-lg transition hover:-translate-y-1 hover:bg-[#f1f2f4]">
                {icon}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
