import { PrismaClient, TopicCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Starter topic bank. Kept intentionally light/non-political per the product
// brief (this is a party game, not a debate club) — see Phase 1 notes.
const topics: {
  text: string;
  category: TopicCategory;
  stanceALabel: string;
  stanceBLabel: string;
}[] = [
  {
    text: 'هل القطط أفضل من الكلاب كحيوانات أليفة؟',
    category: TopicCategory.EVERYDAY_LIFE,
    stanceALabel: 'مع الفكرة',
    stanceBLabel: 'ضد الفكرة',
  },
  {
    text: 'لو خُيّرت، هل تختار قراءة الأفكار أم الطيران؟',
    category: TopicCategory.HYPOTHETICAL,
    stanceALabel: 'قراءة الأفكار',
    stanceBLabel: 'الطيران',
  },
  {
    text: 'هل الأفلام أفضل من المسلسلات؟',
    category: TopicCategory.POP_CULTURE,
    stanceALabel: 'الأفلام',
    stanceBLabel: 'المسلسلات',
  },
  {
    text: 'هل الفطور هو أهم وجبة في اليوم؟',
    category: TopicCategory.EVERYDAY_LIFE,
    stanceALabel: 'مع الفكرة',
    stanceBLabel: 'ضد الفكرة',
  },
  {
    text: 'لو اضطررت للعيش بلا إنترنت أو بلا موسيقى، أيهما تختار؟',
    category: TopicCategory.HYPOTHETICAL,
    stanceALabel: 'بلا إنترنت',
    stanceBLabel: 'بلا موسيقى',
  },
  {
    text: 'هل ألعاب الفيديو مضيعة للوقت؟',
    category: TopicCategory.POP_CULTURE,
    stanceALabel: 'مع الفكرة',
    stanceBLabel: 'ضد الفكرة',
  },
  {
    text: 'هل الأفضل السفر لنفس الوجهة كل مرة أم دائمًا لمكان جديد؟',
    category: TopicCategory.EVERYDAY_LIFE,
    stanceALabel: 'نفس الوجهة',
    stanceBLabel: 'مكان جديد',
  },
  {
    text: 'لو كان بإمكانك امتلاك قوة خارقة واحدة فقط، ماذا تختار: القوة أم السرعة؟',
    category: TopicCategory.HYPOTHETICAL,
    stanceALabel: 'القوة',
    stanceBLabel: 'السرعة',
  },
];

async function main() {
  console.log(`Seeding ${topics.length} topics...`);
  for (const topic of topics) {
    // Avoid duplicate seeding on repeated runs
    const existing = await prisma.topic.findFirst({ where: { text: topic.text } });
    if (!existing) {
      await prisma.topic.create({ data: topic });
    }
  }
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
