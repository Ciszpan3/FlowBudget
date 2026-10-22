import { Router } from 'express';
import { ruleSchema } from '@flowbudget/shared';
import { prisma } from '../../lib/prisma.js';

export const categoriesRouter = Router();
categoriesRouter.get('/', async (req, res) =>
  res.json({
    data: await prisma.category.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isIncome: 'asc' }, { name: 'asc' }],
    }),
  }),
);
categoriesRouter.get('/rules', async (req, res) =>
  res.json({
    data: await prisma.categorizationRule.findMany({
      where: { userId: req.user!.id },
      include: { category: true },
      orderBy: { priority: 'asc' },
    }),
  }),
);
categoriesRouter.post('/rules', async (req, res) => {
  const input = ruleSchema.parse(req.body);
  if (!(await prisma.category.findFirst({ where: { id: input.categoryId, userId: req.user!.id } })))
    throw new Error('NOT_FOUND');
  const rule = await prisma.categorizationRule.create({
    data: { ...input, phrase: input.phrase.toLocaleLowerCase('pl'), userId: req.user!.id },
    include: { category: true },
  });
  res.status(201).json({ data: rule });
});
categoriesRouter.delete('/rules/:id', async (req, res) => {
  const result = await prisma.categorizationRule.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!result.count) throw new Error('NOT_FOUND');
  res.status(204).end();
});
