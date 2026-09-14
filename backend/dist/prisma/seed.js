"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const topics = [
    {
        text: 'هل القطط أفضل من الكلاب كحيوانات أليفة؟',
        category: client_1.TopicCategory.EVERYDAY_LIFE,
        stanceALabel: 'مع الفكرة',
        stanceBLabel: 'ضد الفكرة',
    },
    {
        text: 'لو خُيّرت، هل تختار قراءة الأفكار أم الطيران؟',
        category: client_1.TopicCategory.HYPOTHETICAL,
        stanceALabel: 'قراءة الأفكار',
        stanceBLabel: 'الطيران',
    },
    {
        text: 'هل الأفلام أفضل من المسلسلات؟',
        category: client_1.TopicCategory.POP_CULTURE,
        stanceALabel: 'الأفلام',
        stanceBLabel: 'المسلسلات',
    },
    {
        text: 'هل الفطور هو أهم وجبة في اليوم؟',
        category: client_1.TopicCategory.EVERYDAY_LIFE,
        stanceALabel: 'مع الفكرة',
        stanceBLabel: 'ضد الفكرة',
    },
    {
        text: 'لو اضطررت للعيش بلا إنترنت أو بلا موسيقى، أيهما تختار؟',
        category: client_1.TopicCategory.HYPOTHETICAL,
        stanceALabel: 'بلا إنترنت',
        stanceBLabel: 'بلا موسيقى',
    },
    {
        text: 'هل ألعاب الفيديو مضيعة للوقت؟',
        category: client_1.TopicCategory.POP_CULTURE,
        stanceALabel: 'مع الفكرة',
        stanceBLabel: 'ضد الفكرة',
    },
    {
        text: 'هل الأفضل السفر لنفس الوجهة كل مرة أم دائمًا لمكان جديد؟',
        category: client_1.TopicCategory.EVERYDAY_LIFE,
        stanceALabel: 'نفس الوجهة',
        stanceBLabel: 'مكان جديد',
    },
    {
        text: 'لو كان بإمكانك امتلاك قوة خارقة واحدة فقط، ماذا تختار: القوة أم السرعة؟',
        category: client_1.TopicCategory.HYPOTHETICAL,
        stanceALabel: 'القوة',
        stanceBLabel: 'السرعة',
    },
];
async function main() {
    console.log(`Seeding ${topics.length} topics...`);
    for (const topic of topics) {
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
//# sourceMappingURL=seed.js.map