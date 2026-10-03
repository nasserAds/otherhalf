'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const folders = [
  { title: 'OtherHalf', subtitle: 'مناظرات • Multiplayer', color: 'from-[#b9e4d0] to-[#9bd2bb]', tab: '#9bd2bb', icon: '⚖', href: '/games/otherhalf' },
  { title: 'Rooms', subtitle: 'الغرف المفتوحة', color: 'from-[#b9dcf0] to-[#8ec8e4]', tab: '#8ec8e4', icon: '◌', href: '/rooms' },
  { title: 'Profile', subtitle: 'ملف اللاعب', color: 'from-[#d9c5f0] to-[#c5a8e5]', tab: '#c5a8e5', icon: '✦', href: '/profile' },
  { title: 'Settings', subtitle: 'الإعدادات', color: 'from-[#f6d69d] to-[#efbf70]', tab: '#efbf70', icon: '⚙', href: '/settings' },
];

const collections = [
  ['آخر المناظرات', '12', '#b69de5'],
  ['مناظرات الأصدقاء', '8', '#e8b56d'],
  ['المفضلة', '5', '#86bca7'],
];

function Folder({ item, featured = false }: { item: typeof folders[number]; featured?: boolean }) {
  return (
    <Link href={item.href} className={`group block ${featured ? 'col-span-2' : ''}`}>
      <div className="relative pt-3">
        <div className="absolute right-4 top-0 h-6 w-24 rounded-t-[7px] border-2 border-[#29263a] border-b-0" style={{ background: item.tab }} />
        <motion.div
          whileHover={{ y: -5, rotate: featured ? -0.4 : 0.6 }}
          whileTap={{ scale: 0.98 }}
          className={`relative min-h-[172px] overflow-hidden rounded-[9px] border-2 border-[#29263a] bg-gradient-to-br ${item.color} px-4 pb-4 pt-7 shadow-[3px_5px_0_#29263a] transition-shadow group-hover:shadow-[5px_8px_0_#29263a]`}
        >
          <div className="absolute left-3 top-3 text-[9px] font-bold uppercase tracking-[0.12em] text-[#29263a]/45">OTHERHALF</div>
          <div className="flex h-full min-h-[135px] flex-col items-center justify-center text-center">
            <div className={`grid ${featured ? 'h-16 w-16 text-3xl' : 'h-12 w-12 text-xl'} place-items-center rounded-[8px] border-2 border-[#29263a] bg-white/60 text-[#29263a] shadow-[1px_2px_0_rgba(41,38,58,.35)]`}>
              {item.icon}
            </div>
            <h3 className={`${featured ? 'mt-3 text-xl' : 'mt-2 text-base'} font-black tracking-tight text-[#29263a]`}>{item.title}</h3>
            <p className="mt-1 text-[11px] font-semibold text-[#29263a]/60">{item.subtitle}</p>
          </div>
        </motion.div>
      </div>
    </Link>
  );
}

export default function DesignTestV2() {
  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#f8f5ee] px-4 py-5 text-[#29263a] sm:px-7 md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] border-2 border-[#29263a] bg-[#d8c7f0] text-xl shadow-[2px_3px_0_#29263a]">⚖</div>
            <div>
              <div className="text-2xl font-black tracking-tight">OtherHalf</div>
              <div className="text-[11px] font-semibold text-[#6e6979]">Your debate playground</div>
            </div>
          </div>
          <Link href="/menu" className="flex items-center gap-2 rounded-[6px] border-2 border-[#29263a] bg-white px-4 py-2.5 text-sm font-black shadow-[2px_3px_0_#29263a] transition hover:-translate-y-0.5">
            <span className="text-lg leading-none">☰</span> القائمة
          </Link>
        </header>

        <section className="mt-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b73c9]">مساحتك للعب</p>
          <h1 className="mt-2 max-w-2xl text-[38px] font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">أهلًا بك. جاهز للمناظرة؟</h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#777182]">عالم كامل داخل كل مجلد. افتح OtherHalf، أنشئ غرفة، ودع حجتك تتكلم.</p>
          <p className="mt-2 text-xs font-semibold text-[#5e9d7d]">● لا تحتاج إلى تحميل. العب مباشرة.</p>
        </section>

        <div className="mt-7 flex h-12 items-center gap-3 rounded-[7px] border-2 border-[#29263a] bg-white px-4 shadow-[2px_3px_0_#29263a]">
          <span className="text-xl text-[#8e879b]">⌕</span>
          <span className="text-sm font-semibold text-[#9a94a2]">ابحث عن لعبة أو غرفة</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            ['⚖', 'OtherHalf'], ['◷', 'آخر ما لعبت'], ['♡', 'المفضلة'], ['•', 'مع الأصدقاء'],
          ].map(([icon, label], i) => (
            <button key={label} className={`flex h-11 items-center justify-center gap-2 rounded-[6px] border-2 border-[#29263a] px-3 text-xs font-black shadow-[2px_3px_0_#29263a] transition active:translate-y-[2px] active:shadow-none ${i === 0 ? 'bg-[#e9ddff] text-[#7f5fca]' : 'bg-white'}`}>
              <span className="text-base">{icon}</span>{label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {['كل شيء', 'مناظرات', 'Multiplayer', 'مستجدات'].map((label, i) => (
            <button key={label} className={`rounded-[5px] border-2 border-[#29263a] px-5 py-2 text-xs font-black shadow-[2px_3px_0_#29263a] ${i === 0 ? 'bg-[#d9c6f1]' : 'bg-white'}`}>{label}</button>
          ))}
        </div>

        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-black">افتح مجلدًا. ابدأ اللعب.</h2>
              <p className="mt-1 text-xs font-semibold text-[#8b8492]">كل أدواتك موجودة في مكان واحد.</p>
            </div>
            <Link href="/games/otherhalf" className="hidden text-xs font-black text-[#8666c8] sm:block">استكشف →</Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
            {folders.map((item, i) => <Folder key={item.title} item={item} featured={i === 0} />)}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8492]">مجموعات</span>
            <button className="text-2xl leading-none">＋</button>
          </div>
          <div className="space-y-2.5">
            {collections.map(([name, count, dot]) => (
              <Link key={name} href="/menu" className="flex h-12 items-center gap-3 rounded-[6px] border-2 border-[#29263a] bg-white px-3.5 shadow-[2px_3px_0_#29263a] transition hover:-translate-y-0.5">
                <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
                <span className="text-xs font-black">{name}</span>
                <span className="mr-auto text-xs font-bold text-[#8b8492]">{count}</span>
                <span className="text-lg">←</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="relative mt-8 overflow-hidden rounded-[8px] border-2 border-[#29263a] bg-[#e8ddff] p-6 shadow-[2px_4px_0_#29263a]">
          <div className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 rotate-[-2deg] border border-[#d5bd78] bg-[#f5e5a9] opacity-80" />
          <div className="text-2xl">✧</div>
          <h2 className="mt-1 text-2xl font-black">مفاجأة صغيرة؟</h2>
          <p className="mt-1 text-xs font-semibold text-[#777182]">دعنا نختار لك مناظرة قد تعجبك.</p>
          <Link href="/games/otherhalf" className="mt-5 inline-flex items-center gap-2 rounded-[5px] border-2 border-[#29263a] bg-white px-4 py-2.5 text-xs font-black shadow-[2px_3px_0_#29263a]">↗ فاجئني</Link>
        </section>

        <footer className="mt-8 flex items-center justify-between pb-5">
          <Link href="/profile" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[5px] border-2 border-[#29263a] bg-[#f1d0bc] text-xs font-black shadow-[1px_2px_0_#29263a]">OH</div>
            <div>
              <div className="text-xs font-black">ملفي الشخصي</div>
              <div className="text-[10px] font-semibold text-[#8b8492]">جاهز للعب</div>
            </div>
          </Link>
          <div className="text-[10px] font-bold text-[#a19aa7]">OtherHalf • Design Test V2</div>
        </footer>
      </div>
    </main>
  );
}
