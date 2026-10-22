import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseCsv } from './csv.js';
describe('CSV', () => {
  it('wykrywa separator i normalizuje polski format', () => {
    const csv = 'Data;Opis;Kwota\n22.10.2026;Biedronka;-12,34';
    expect(detectDelimiter(csv)).toBe(';');
    expect(parseCsv(csv, { date: 'Data', description: 'Opis', amount: 'Kwota' })).toEqual([
      { date: '2026-10-22', description: 'Biedronka', amount: '12.34', type: 'EXPENSE' },
    ]);
  });
});
