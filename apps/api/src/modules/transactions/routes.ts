import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { transactionSchema, transferSchema } from '@flowbudget/shared';
import { prisma } from '../../lib/prisma.js';

export const transactionsRouter = Router();

transactionsRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const type =
    typeof req.query.type === 'string' &&
    ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(req.query.type)
      ? (req.query.type as any)
      : undefined;
  const where: Prisma.TransactionWhereInput = {
    userId: req.user!.id,
    ...(type ? { type } : {}),
    ...(search ? { description: { contains: search, mode: 'insensitive' } } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: { select: { id: true, name: true } } },
      orderBy: [{ bookedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);
  res.json({
    data: data.map((tx) => ({ ...tx, amount: tx.amount.toFixed(2) })),
    meta: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  });
});

transactionsRouter.post('/', async (req, res) => {
  const input = transactionSchema.parse(req.body);
  const account = await prisma.account.findFirst({
    where: { id: input.accountId, userId: req.user!.id, archivedAt: null },
  });
  if (!account) throw new Error('NOT_FOUND');
  if (
    input.categoryId &&
    !(await prisma.category.findFirst({ where: { id: input.categoryId, userId: req.user!.id } }))
  )
    throw new Error('NOT_FOUND');
  const tx = await prisma.transaction.create({
    data: {
      ...input,
      categoryId: input.categoryId ?? null,
      userId: req.user!.id,
      amount: new Prisma.Decimal(input.amount.replace(',', '.')),
      bookedAt: new Date(`${input.bookedAt}T00:00:00.000Z`),
    },
  });
  res.status(201).json({ data: { ...tx, amount: tx.amount.toFixed(2) } });
});

transactionsRouter.put('/:id', async (req, res) => {
  const input = transactionSchema.parse(req.body);
  const existing = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.user!.id, transferGroupId: null },
  });
  if (!existing) throw new Error('NOT_FOUND');
  const account = await prisma.account.findFirst({
    where: { id: input.accountId, userId: req.user!.id, archivedAt: null },
  });
  if (!account) throw new Error('NOT_FOUND');
  const tx = await prisma.transaction.update({
    where: { id: existing.id },
    data: {
      ...input,
      categoryId: input.categoryId ?? null,
      amount: new Prisma.Decimal(input.amount.replace(',', '.')),
      bookedAt: new Date(`${input.bookedAt}T00:00:00.000Z`),
    },
  });
  res.json({ data: { ...tx, amount: tx.amount.toFixed(2) } });
});

transactionsRouter.delete('/:id', async (req, res) => {
  const tx = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!tx) throw new Error('NOT_FOUND');
  await prisma.$transaction(
    async (db) => {
      if (tx.transferGroupId)
        await db.transaction.deleteMany({
          where: { transferGroupId: tx.transferGroupId, userId: req.user!.id },
        });
      else await db.transaction.delete({ where: { id: tx.id } });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  res.status(204).end();
});

transactionsRouter.post('/transfer', async (req, res) => {
  const input = transferSchema.parse(req.body);
  const accounts = await prisma.account.findMany({
    where: {
      id: { in: [input.fromAccountId, input.toAccountId] },
      userId: req.user!.id,
      archivedAt: null,
    },
  });
  if (accounts.length !== 2 || accounts.some((a) => a.currency !== 'PLN'))
    throw new Error('NOT_FOUND');
  const amount = new Prisma.Decimal(input.amount.replace(',', '.'));
  const transferGroupId = randomUUID();
  const bookedAt = new Date(`${input.bookedAt}T00:00:00.000Z`);
  const data = await prisma.$transaction(
    async (db) =>
      Promise.all([
        db.transaction.create({
          data: {
            userId: req.user!.id,
            accountId: input.fromAccountId,
            type: 'TRANSFER_OUT',
            amount,
            description: input.description,
            bookedAt,
            transferGroupId,
          },
        }),
        db.transaction.create({
          data: {
            userId: req.user!.id,
            accountId: input.toAccountId,
            type: 'TRANSFER_IN',
            amount,
            description: input.description,
            bookedAt,
            transferGroupId,
          },
        }),
      ]),
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  res.status(201).json({ data: data.map((tx) => ({ ...tx, amount: tx.amount.toFixed(2) })) });
});
