require('../src/config/env');

const db = require('../src/config/db');

const presets = [
  {
    name: 'Social',
    vocabularyDomainDescription: 'Everyday greetings, conversation, and social interactions.',
  },
  {
    name: 'Medical',
    vocabularyDomainDescription: 'Healthcare conversations, symptoms, treatment, and medication.',
  },
  {
    name: 'Legal',
    vocabularyDomainDescription: 'Legal services, rights, appointments, and formal proceedings.',
  },
];

async function seed() {
  for (const preset of presets) {
    await db.contextPreset.upsert({
      where: { name: preset.name },
      create: preset,
      update: { vocabularyDomainDescription: preset.vocabularyDomainDescription },
    });
  }
}

seed()
  .catch((error) => {
    console.error('Database seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());