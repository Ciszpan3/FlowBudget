import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { budgetSchema } from '@flowbudget/shared';
import { prisma } from '../../lib/prisma.js';

export const budgetsRouter = Router();
budgetsRouter.get('/', async (req, res) => {
  const month =
    typeof req.query.month === 'string' ? req.query.month : new Date().toISOString().slice(0, 7);
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const budgets = await prisma.budget.findMany({
    where: { userId: req.user!.id, month: start },
    include: { category: true },
  });
  const spent = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId: req.user!.id,
      type: 'EXPENSE',
      bookedAt: { gte: start, lt: end },
      categoryId: { not: null },
    },
    _sum: { amount: true },
  });
  const byCategory = new Map(
    spent.map((row) => [row.categoryId, row._sum.amount?.toFixed(2) ?? '0.00']),
  );
  res.json({
    data: budgets.map((budget) => ({
      ...budget,
      limit: budget.limit.toFixed(2),
      spent: byCategory.get(budget.categoryId) ?? '0.00',
    })),
  });
});
budgetsRouter.post('/', async (req, res) => {
  const input = budgetSchema.parse(req.body);
  if (
    !(await prisma.category.findFirst({
      where: { id: input.categoryId, userId: req.user!.id, isIncome: false },
    }))
  )
    throw new Error('NOT_FOUND');
  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId: req.user!.id,
        categoryId: input.categoryId,
        month: new Date(`${input.month}-01T00:00:00.000Z`),
      },
    },
    create: {
      userId: req.user!.id,
      categoryId: input.categoryId,
      month: new Date(`${input.month}-01T00:00:00.000Z`),
      limit: new Prisma.Decimal(input.limit.replace(',', '.')),
    },
    update: { limit: new Prisma.Decimal(input.limit.replace(',', '.')) },
    include: { category: true },
  });
  res.status(201).json({ data: { ...budget, limit: budget.limit.toFixed(2), spent: '0.00' } });
});
budgetsRouter.delete('/:id', async (req, res) => {
  const result = await prisma.budget.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!result.count) throw new Error('NOT_FOUND');
  res.status(204).end();
});
