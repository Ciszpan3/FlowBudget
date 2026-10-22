import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export const analyticsRouter = Router();
const money = (value: Prisma.Decimal | null | undefined) => value?.toFixed(2) ?? '0.00';

analyticsRouter.get('/dashboard', async (req, res) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [accounts, current, categories, recent, budgets] = await prisma.$transaction([
    prisma.account.findMany({
      where: { userId: req.user!.id, archivedAt: null },
      include: { transactions: { select: { type: true, amount: true } } },
    }),
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId: req.user!.id, bookedAt: { gte: start } },
      _sum: { amount: true },
      orderBy: { type: 'asc' },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: req.user!.id,
        type: 'EXPENSE',
        bookedAt: { gte: start },
        categoryId: { not: null },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 6,
    }),
    prisma.transaction.findMany({
      where: { userId: req.user!.id },
      include: {
        account: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
      orderBy: [{ bookedAt: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    }),
    prisma.budget.findMany({
      where: { userId: req.user!.id, month: start },
      include: { category: true },
    }),
  ]);
  const totals = new Map(
    current.map((row) => [row.type, row._sum?.amount ?? new Prisma.Decimal(0)]),
  );
  const income = totals.get('INCOME') ?? new Prisma.Decimal(0);
  const expenses = totals.get('EXPENSE') ?? new Prisma.Decimal(0);
  const balance = accounts.reduce(
    (sum, account) =>
      account.transactions.reduce(
        (acc, tx) =>
          acc.plus(['INCOME', 'TRANSFER_IN'].includes(tx.type) ? tx.amount : tx.amount.negated()),
        sum.plus(account.openingBalance),
      ),
    new Prisma.Decimal(0),
  );
  const categoryRecords = await prisma.category.findMany({
    where: {
      id: { in: categories.flatMap((x) => (x.categoryId ? [x.categoryId] : [])) },
      userId: req.user!.id,
    },
  });
  const categoryMap = new Map(categoryRecords.map((x) => [x.id, x]));
  res.json({
    data: {
      summary: {
        balance: money(balance),
        income: money(income),
        expenses: money(expenses),
        net: income.minus(expenses).toFixed(2),
        savingsRate: income.gt(0)
          ? income.minus(expenses).div(income).mul(100).toDecimalPlaces(1).toString()
          : '0',
      },
      categories: categories.map((row) => ({
        id: row.categoryId,
        name: categoryMap.get(row.categoryId!)?.name ?? 'Inne',
        color: categoryMap.get(row.categoryId!)?.color ?? '#94a3b8',
        value: money(row._sum?.amount),
      })),
      recent: recent.map((tx) => ({ ...tx, amount: tx.amount.toFixed(2) })),
      budgets: budgets.map((b) => ({ ...b, limit: b.limit.toFixed(2) })),
    },
  });
});

analyticsRouter.get('/trends', async (req, res) => {
  const months = Math.min(24, Math.max(3, Number(req.query.months) || 6));
  const from = new Date();
  from.setUTCMonth(from.getUTCMonth() - months + 1);
  from.setUTCDate(1);
  from.setUTCHours(0, 0, 0, 0);
  const rows = await prisma.$queryRaw<
    Array<{ month: Date; type: string; total: Prisma.Decimal }>
  >(Prisma.sql`
    SELECT date_trunc('month', "bookedAt") AS month, type::text, SUM(amount) AS total
    FROM "Transaction" WHERE "userId" = ${req.user!.id} AND "bookedAt" >= ${from} AND type IN ('INCOME','EXPENSE')
    GROUP BY 1, 2 ORDER BY 1 ASC`);
  const result = new Map<string, { month: string; income: string; expenses: string }>();
  for (const row of rows) {
    const key = row.month.toISOString().slice(0, 7);
    const current = result.get(key) ?? { month: key, income: '0.00', expenses: '0.00' };
    current[row.type === 'INCOME' ? 'income' : 'expenses'] = row.total.toFixed(2);
    result.set(key, current);
  }
  res.json({ data: [...result.values()] });
});
