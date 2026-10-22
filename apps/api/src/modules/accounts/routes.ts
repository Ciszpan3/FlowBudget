import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { accountSchema } from '@flowbudget/shared';
import { prisma } from '../../lib/prisma.js';

export const accountsRouter = Router();

accountsRouter.get('/', async (req, res) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.user!.id, archivedAt: null },
    orderBy: { createdAt: 'asc' },
    include: { transactions: { select: { type: true, amount: true } } },
  });
  res.json({
    data: accounts.map(({ transactions, ...account }) => {
      const balance = transactions.reduce(
        (sum, tx) =>
          sum.plus(['INCOME', 'TRANSFER_IN'].includes(tx.type) ? tx.amount : tx.amount.negated()),
        account.openingBalance,
      );
      return {
        ...account,
        openingBalance: account.openingBalance.toFixed(2),
        balance: balance.toFixed(2),
      };
    }),
  });
});

accountsRouter.post('/', async (req, res) => {
  const input = accountSchema.parse(req.body);
  const account = await prisma.account.create({
    data: {
      ...input,
      openingBalance: new Prisma.Decimal(input.openingBalance.replace(',', '.')),
      userId: req.user!.id,
    },
  });
  res.status(201).json({
    data: {
      ...account,
      openingBalance: account.openingBalance.toFixed(2),
      balance: account.openingBalance.toFixed(2),
    },
  });
});

accountsRouter.delete('/:id', async (req, res) => {
  const result = await prisma.account.updateMany({
    where: { id: req.params.id, userId: req.user!.id, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  if (!result.count) throw new Error('NOT_FOUND');
  res.status(204).end();
});
