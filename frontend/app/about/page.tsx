'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#f8f5ee] px-4 py-6 text-[#29263a] sm:px-7 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/menu" className="rounded-[6px] border-2 border-[#29263a] bg-white px-4 py-2 text-xs font-black shadow-[2px_3px_0_#29263a]">
            ← رجوع
          </Link>
          <div className="text-xs font-black text-[#8b8492]">ABOUT OTHERHALF</div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-8 overflow-hidden rounded-[9px] border-2 border-[#29263a] bg-[#e8ddff] p-6 shadow-[3px_5px_0_#29263a] sm:p-9"
        >
          <div className="absolute -top-3 left-1/2 h-8 w-28 -translate-x-1/2 rotate-[-2deg] border border-[#d5bd78] bg-[#f5e5a9] opacity-80" />
          <div className="text-4xl">✦</div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#8666c8]">قصتنا</p>
          <h1 className="mt-2 text-[clamp(2.3rem,6vw,4rem)] font-black leading-[0.98] tracking-tight">مرحبًا بك في OtherHalf.</h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-[#655f70]">
            OtherHalf هو مشروع صنعه <strong className="text-[#29263a]">Nasser و Rim</strong> من أجل مجتمعنا. بدأنا بفكرة بسيطة: مكان يجمع الناس للعب، التنافس، وتجربة ألعاب مختلفة مع بعضهم.
          </p>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#655f70]">
            لعبة المناظرات هي واحدة من ألعاب OtherHalf فقط. هدفنا أن نبني مساحة متعددة الألعاب، ونضيف إليها تجارب جديدة مع الوقت، بينما يبقى المجتمع هو الجزء الأهم منها.
          </p>
        </motion.section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[8px] border-2 border-[#29263a] bg-[#b9e4d0] p-6 shadow-[2px_4px_0_#29263a]">
            <div className="text-3xl">🎮</div>
            <h2 className="mt-3 text-xl font-black">ألعاب متعددة</h2>
            <p className="mt-2 text-xs font-semibold leading-6 text-[#4e6659]">OtherHalf ليست لعبة واحدة. المناظرات مجرد البداية، وألعاب أخرى ستأتي لاحقًا.</p>
          </div>
          <div className="rounded-[8px] border-2 border-[#29263a] bg-[#f6d69d] p-6 shadow-[2px_4px_0_#29263a]">
            <div className="text-3xl">♥</div>
            <h2 className="mt-3 text-xl font-black">من أجل المجتمع</h2>
            <p className="mt-2 text-xs font-semibold leading-6 text-[#715a36]">نبني هذا المكان لنا ولمجتمع OtherHalf — للعب، الضحك، والمنافسة معًا.</p>
          </div>
        </section>

        <section className="mt-6 rounded-[8px] border-2 border-[#29263a] bg-white p-6 shadow-[2px_4px_0_#29263a] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b8492]">صنّاع المشروع</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-[7px] border-2 border-[#29263a] bg-[#f1d0bc] p-4 shadow-[2px_3px_0_#29263a]">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[6px] border-2 border-[#29263a] bg-white text-sm font-black">N</div>
              <div><div className="font-black">Nasser</div><div className="text-[10px] font-semibold text-[#756d7c]">Co-creator</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-[7px] border-2 border-[#29263a] bg-[#d9c5f0] p-4 shadow-[2px_3px_0_#29263a]">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[6px] border-2 border-[#29263a] bg-white text-sm font-black">R</div>
              <div><div className="font-black">Rim</div><div className="text-[10px] font-semibold text-[#756d7c]">Co-creator</div></div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-2 text-center text-xs font-bold text-[#a19aa7]">
          <Link href="/menu" className="rounded-[5px] border border-[#29263a]/15 bg-white px-3 py-2">العودة للألعاب</Link>
          <span className="self-center">Made for the OtherHalf community.</span>
        </div>
      </div>
    </main>
  );
}
