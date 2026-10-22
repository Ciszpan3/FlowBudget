import { describe, expect, it } from 'vitest';
import { centsToMoney, moneyToCents, normalizeMoney, simulateSavings } from './index.js';

describe('money', () => {
  it('normalizuje polski separator i zachowuje grosze', () => {
    expect(normalizeMoney('1 234,5')).toBe('1234.50');
    expect(moneyToCents('0.29')).toBe(29n);
    expect(centsToMoney(-501n)).toBe('-5.01');
  });
  it('symuluje oszczędności bez floatów', () => {
    expect(simulateSavings('100.10', '20.20', 2).at(-1)?.amount).toBe('140.50');
  });
});
