import { Router } from 'express';
import multer from 'multer';
import iconv from 'iconv-lite';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { fingerprint, parseCsv, type ImportRow } from './csv.js';

export const importsRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});
importsRouter.post('/preview', upload.single('file'), async (req, res) => {
  if (
    !req.file ||
    !['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/octet-stream'].includes(
      req.file.mimetype,
    )
  )
    return res
      .status(400)
      .json({ error: { code: 'INVALID_FILE', message: 'Wybierz plik CSV do 2 MB.' } });
  const encoding = req.body.encoding === 'windows-1250' ? 'win1250' : 'utf8';
  const mapping = z
    .object({
      date: z.string().min(1),
      description: z.string().min(1),
      amount: z.string().min(1),
      type: z.string().optional(),
    })
    .parse(JSON.parse(req.body.mapping ?? '{}'));
  const rows = parseCsv(iconv.decode(req.file.buffer, encoding), mapping);
  const rules = await prisma.categorizationRule.findMany({
    where: { userId: req.user!.id },
    orderBy: { priority: 'asc' },
  });
  res.json({
    data: rows.slice(0, 1000).map((row) => ({
      ...row,
      categoryId:
        rules.find((rule) => row.description.toLocaleLowerCase('pl').includes(rule.phrase))
          ?.categoryId ?? null,
    })),
  });
});
const commitSchema = z.object({
  accountId: z.string(),
  filename: z.string().max(255),
  rows: z
    .array(
      z.object({
        date: z.iso.date(),
        description: z.string().min(1).max(240),
        amount: z.string().regex(/^\d+\.\d{2}$/),
        type: z.enum(['INCOME', 'EXPENSE']),
        categoryId: z.string().nullable().optional(),
        skip: z.boolean().optional(),
      }),
    )
    .max(1000),
});
importsRouter.post('/commit', async (req, res) => {
  const input = commitSchema.parse(req.body);
  if (!(await prisma.account.findFirst({ where: { id: input.accountId, userId: req.user!.id } })))
    throw new Error('NOT_FOUND');
  const active = input.rows.filter((r) => !r.skip);
  const hashes = active.map((r) => fingerprint(req.user!.id, input.accountId, r as ImportRow));
  const duplicates = new Set(
    (
      await prisma.transaction.findMany({
        where: { userId: req.user!.id, fingerprint: { in: hashes } },
        select: { fingerprint: true },
      })
    ).flatMap((x) => (x.fingerprint ? [x.fingerprint] : [])),
  );
  const fresh = active.filter(
    (row) => !duplicates.has(fingerprint(req.user!.id, input.accountId, row as ImportRow)),
  );
  const batch = await prisma.$transaction(
    async (db) => {
      const created = await db.importBatch.create({
        data: {
          userId: req.user!.id,
          accountId: input.accountId,
          filename: input.filename,
          status: 'COMMITTED',
          importedCount: fresh.length,
          skippedCount: input.rows.length - fresh.length,
          committedAt: new Date(),
        },
      });
      if (fresh.length)
        await db.transaction.createMany({
          data: fresh.map((row) => ({
            userId: req.user!.id,
            accountId: input.accountId,
            categoryId: row.categoryId ?? null,
            type: row.type,
            amount: new Prisma.Decimal(row.amount),
            description: row.description,
            bookedAt: new Date(`${row.date}T00:00:00.000Z`),
            fingerprint: fingerprint(req.user!.id, input.accountId, row as ImportRow),
            importBatchId: created.id,
          })),
        });
      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  res.status(201).json({ data: batch });
});
importsRouter.get('/', async (req, res) =>
  res.json({
    data: await prisma.importBatch.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  }),
);
