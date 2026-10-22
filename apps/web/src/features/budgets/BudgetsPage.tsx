import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { api, formatMoney } from '../../lib/api';
import { Button, Card, Empty, Field, Input, Select } from '../../components/ui/ui';
import type { Budget, Category } from '../shared/types';
import styles from './BudgetsPage.module.scss';
import crud from '../shared/Crud.module.scss';
export function BudgetsPage() {
  const month = new Date().toISOString().slice(0, 7);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['budgets', month],
    queryFn: () => api<{ data: Budget[] }>(`/budgets?month=${month}`),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<{ data: Category[] }>('/categories'),
  });
  const create = useMutation({
    mutationFn: (data: Record<string, string>) =>
      api('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['budgets'] });
      setOpen(false);
    },
  });
  return (
    <>
      <header className={crud.header}>
        <div>
          <h1>Budżety</h1>
          <p>Limity, które wspierają decyzje — bez poczucia winy.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={17} />
          Nowy limit
        </Button>
      </header>
      <div className={styles.month}>
        {new Date(`${month}-01`).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
      </div>
      {q.data?.data.length ? (
        <div className={styles.list}>
          {q.data.data.map((b) => {
            const ratio = Math.min(100, (Number(b.spent) / Number(b.limit)) * 100);
            const exceeded = Number(b.spent) > Number(b.limit);
            return (
              <Card key={b.id}>
                <div className={styles.row}>
                  <span className={styles.dot} style={{ background: b.category.color }} />
                  <div>
                    <strong>{b.category.name}</strong>
                    <small>
                      {formatMoney(b.spent)} z {formatMoney(b.limit)}
                    </small>
                  </div>
                  <b>{Math.round(ratio)}%</b>
                </div>
                <div className={styles.track}>
                  <i
                    style={{
                      width: `${ratio}%`,
                      background: exceeded ? 'var(--danger)' : b.category.color,
                    }}
                  />
                </div>
                {exceeded && (
                  <p className={styles.warning}>
                    <AlertTriangle size={14} />
                    Limit przekroczony o {formatMoney(Number(b.spent) - Number(b.limit))}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        !q.isLoading && (
          <Empty
            title="Zaplanuj pierwszy budżet"
            description="Ustal miesięczny limit dla wybranej kategorii."
          />
        )
      )}
      {open && (
        <div className={crud.overlay}>
          <form
            className={crud.dialog}
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(
                Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>,
              );
            }}
          >
            <header>
              <div>
                <h2>Limit kategorii</h2>
                <p>Limit dotyczy bieżącego miesiąca.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                <X />
              </button>
            </header>
            <Field label="Kategoria">
              <Select name="categoryId" required>
                <option value="">Wybierz</option>
                {categories.data?.data
                  .filter((c) => !c.isIncome)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Miesięczny limit">
              <Input name="limit" inputMode="decimal" required placeholder="1 000,00" />
            </Field>
            <input type="hidden" name="month" value={month} />
            <Button disabled={create.isPending}>Zapisz limit</Button>
          </form>
        </div>
      )}
    </>
  );
}
