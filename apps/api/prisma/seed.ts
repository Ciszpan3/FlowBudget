import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from '@node-rs/argon2';
const prisma = new PrismaClient();
async function main() {
  const password = await hash('ZAQ!2wsx', {
    algorithm: 2,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  const user = await prisma.user.upsert({
    where: { email: 'demo@flowbudget.local' },
    update: {
      password,
    },
    create: {
      email: 'demo@flowbudget.local',
      name: 'Demo',
      password,
      categories: {
        create: [
          { name: 'Zakupy spożywcze', color: '#79b473', icon: 'shopping-basket' },
          { name: 'Transport', color: '#63a4ff', icon: 'car' },
          { name: 'Mieszkanie', color: '#b98cff', icon: 'house' },
          { name: 'Subskrypcje', color: '#ff8a65', icon: 'repeat' },
          { name: 'Wynagrodzenie', color: '#31b57b', icon: 'wallet', isIncome: true },
        ],
      },
    },
  });
  if (await prisma.account.count({ where: { userId: user.id } })) return;
  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Konto główne',
      type: 'BANK',
      currency: 'PLN',
      openingBalance: new Prisma.Decimal('2500.00'),
    },
  });
  const cats = await prisma.category.findMany({ where: { userId: user.id } });
  const get = (name: string) => cats.find((x) => x.name === name)!.id;
  const now = new Date();
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        accountId: account.id,
        categoryId: get('Wynagrodzenie'),
        type: 'INCOME',
        amount: new Prisma.Decimal('7800'),
        description: 'Wynagrodzenie',
        bookedAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      },
      {
        userId: user.id,
        accountId: account.id,
        categoryId: get('Zakupy spożywcze'),
        type: 'EXPENSE',
        amount: new Prisma.Decimal('184.32'),
        description: 'Biedronka',
        bookedAt: new Date(),
      },
      {
        userId: user.id,
        accountId: account.id,
        categoryId: get('Subskrypcje'),
        type: 'EXPENSE',
        amount: new Prisma.Decimal('60'),
        description: 'Netflix',
        bookedAt: new Date(),
      },
    ],
  });
  await prisma.categorizationRule.createMany({
    data: [
      { userId: user.id, categoryId: get('Zakupy spożywcze'), phrase: 'biedronka', priority: 10 },
      { userId: user.id, categoryId: get('Transport'), phrase: 'orlen', priority: 20 },
      { userId: user.id, categoryId: get('Subskrypcje'), phrase: 'netflix', priority: 30 },
    ],
  });
  console.log('Dane demonstracyjne: demo@flowbudget.local / ZAQ!2wsx');
}
main().finally(() => prisma.$disconnect());
