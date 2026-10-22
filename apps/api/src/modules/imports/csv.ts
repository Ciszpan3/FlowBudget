import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';

export type ImportRow = {
  date: string;
  description: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId?: string | null;
  skip?: boolean;
};
export function detectDelimiter(text: string) {
  const head = text.split(/\r?\n/, 1)[0] ?? '';
  return [';', ',', '\t'].sort((a, b) => head.split(b).length - head.split(a).length)[0] ?? ';';
}
export function parseCsv(
  text: string,
  mapping: { date: string; description: string; amount: string; type?: string | undefined },
): ImportRow[] {
  const records = parse(text.replace(/^\uFEFF/, ''), {
    columns: true,
    skip_empty_lines: true,
    delimiter: detectDelimiter(text),
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  return records.map((record) => {
    const rawDate = record[mapping.date] ?? '';
    const parts = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$|^(\d{2})[./-](\d{2})[./-](\d{4})$/);
    if (!parts) throw new Error(`Nieprawidłowa data: ${rawDate}`);
    const date = parts[1]
      ? `${parts[1]}-${parts[2]}-${parts[3]}`
      : `${parts[6]}-${parts[5]}-${parts[4]}`;
    const raw = (record[mapping.amount] ?? '').replace(/\s/g, '').replace(',', '.');
    const number = Number(raw);
    if (!Number.isFinite(number) || number === 0) throw new Error(`Nieprawidłowa kwota: ${raw}`);
    const explicit = mapping.type ? record[mapping.type]?.toLocaleLowerCase('pl') : undefined;
    const type =
      explicit?.includes('przych') || explicit?.includes('income') || number > 0
        ? 'INCOME'
        : 'EXPENSE';
    return {
      date,
      description: (record[mapping.description] ?? '').slice(0, 240),
      amount: Math.abs(number).toFixed(2),
      type,
    };
  });
}
export function fingerprint(userId: string, accountId: string, row: ImportRow) {
  return createHash('sha256')
    .update(
      [
        userId,
        accountId,
        row.date,
        row.amount,
        row.description.trim().toLocaleLowerCase('pl'),
      ].join('|'),
    )
    .digest('hex');
}
