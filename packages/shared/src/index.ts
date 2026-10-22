import { z } from 'zod';

export const currencySchema = z.literal('PLN');
export const moneySchema = z.string().regex(/^-?\d{1,15}([.,]\d{1,2})?$/, 'Nieprawidłowa kwota');
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const dateSchema = z.iso.date();

export const registerSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(2).max(80),
});
export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});
export const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(['BANK', 'CASH', 'SAVINGS']),
  currency: currencySchema.default('PLN'),
  openingBalance: moneySchema,
});
export const transactionSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: moneySchema.refine((v) => Number(v.replace(',', '.')) > 0, 'Kwota musi być dodatnia'),
  description: z.string().trim().min(1).max(240),
  bookedAt: dateSchema,
});
export const transferSchema = z
  .object({
    fromAccountId: z.string().min(1),
    toAccountId: z.string().min(1),
    amount: moneySchema.refine((v) => Number(v.replace(',', '.')) > 0),
    description: z.string().trim().min(1).max(240).default('Transfer'),
    bookedAt: dateSchema,
  })
  .refine((v) => v.fromAccountId !== v.toAccountId, { message: 'Konta muszą być różne' });
export const budgetSchema = z.object({
  categoryId: z.string().min(1),
  month: monthSchema,
  limit: moneySchema.refine((v) => Number(v.replace(',', '.')) > 0),
});
export const ruleSchema = z.object({
  phrase: z.string().trim().min(2).max(100),
  categoryId: z.string().min(1),
  priority: z.number().int().min(0).max(1000).default(100),
});

export type ApiError = { error: { code: string; message: string; details?: unknown } };
export type SessionUser = { id: string; name: string; email: string };

export function normalizeMoney(value: string): string {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const match = /^(-?)(\d+)(?:\.(\d{0,2}))?$/.exec(normalized);
  if (!match) throw new Error('Nieprawidłowa kwota');
  const [, sign, units, fraction = ''] = match;
  return `${sign}${units}.${fraction.padEnd(2, '0')}`;
}

export function moneyToCents(value: string): bigint {
  const normalized = normalizeMoney(value);
  const negative = normalized.startsWith('-');
  const [units = '0', fraction = '00'] = normalized.replace('-', '').split('.');
  const cents = BigInt(units) * 100n + BigInt(fraction);
  return negative ? -cents : cents;
}

export function centsToMoney(cents: bigint): string {
  const sign = cents < 0n ? '-' : '';
  const absolute = cents < 0n ? -cents : cents;
  return `${sign}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

export function simulateSavings(initial: string, monthly: string, months: number) {
  const initialCents = moneyToCents(initial);
  const monthlyCents = moneyToCents(monthly);
  return Array.from({ length: months + 1 }, (_, month) => ({
    month,
    amount: centsToMoney(initialCents + monthlyCents * BigInt(month)),
  }));
}
