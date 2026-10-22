import { render, screen } from '@testing-library/react';
import { SavingsPage } from './SavingsPage';
import { describe, expect, it } from 'vitest';
describe('SavingsPage', () => {
  it('pokazuje wynik symulacji', () => {
    render(<SavingsPage />);
    expect(screen.getByText('Prognozowana suma').nextElementSibling).toHaveTextContent(
      /24.*200,00/,
    );
  });
});
