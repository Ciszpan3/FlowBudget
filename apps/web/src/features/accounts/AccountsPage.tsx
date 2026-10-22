import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, PiggyBank, Wallet, X } from 'lucide-react';
import { api, formatMoney } from '../../lib/api';
import { Button, Card, Field, Input, Select } from '../../components/ui/ui';
import { PageState } from '../shared/PageState';
import type { Account } from '../shared/types';
import styles from '../shared/Crud.module.scss';
const icons = { BANK: Building2, CASH: Wallet, SAVINGS: PiggyBank };
const labels = { BANK: 'Konto bankowe', CASH: 'Gotówka', SAVINGS: 'Oszczędności' };
export function AccountsPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api<{ data: Account[] }>('/accounts'),
  });
  const create = useMutation({
    mutationFn: (body: Record<string, string>) =>
      api('/accounts', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['accounts'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      setOpen(false);
    },
  });
  return (
    <>
      <header className={styles.header}>
        <div>
          <h1>Konta</h1>
          <p>Wszystkie miejsca, w których trzymasz pieniądze.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={17} />
          Dodaj konto
        </Button>
      </header>
      <PageState loading={q.isLoading} error={q.error} empty={!q.data?.data.length}>
        <div className={styles.cardGrid}>
          {q.data?.data.map((account) => {
            const Icon = icons[account.type];
            return (
              <Card key={account.id} className={styles.account}>
                <div className={styles.accountTop}>
                  <span>
                    <Icon />
                  </span>
                  <small>{labels[account.type]}</small>
                </div>
                <h2>{account.name}</h2>
                <p>Dostępne saldo</p>
                <strong>{formatMoney(account.balance)}</strong>
                <footer>
                  <span>{account.currency}</span>
                  <span>•••• {account.id.slice(-4).toUpperCase()}</span>
                </footer>
              </Card>
            );
          })}
        </div>
      </PageState>
      {open && (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form
            className={styles.dialog}
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              create.mutate(Object.fromEntries(data) as Record<string, string>);
            }}
          >
            <header>
              <div>
                <h2>Nowe konto</h2>
                <p>Saldo początkowe nie jest przychodem.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Zamknij">
                <X />
              </button>
            </header>
            <Field label="Nazwa">
              <Input name="name" required minLength={2} />
            </Field>
            <Field label="Typ">
              <Select name="type" defaultValue="BANK">
                <option value="BANK">Konto bankowe</option>
                <option value="CASH">Gotówka</option>
                <option value="SAVINGS">Konto oszczędnościowe</option>
              </Select>
            </Field>
            <Field label="Saldo początkowe">
              <Input name="openingBalance" inputMode="decimal" defaultValue="0,00" required />
            </Field>
            <input type="hidden" name="currency" value="PLN" />
            {create.error && <p className={styles.error}>{create.error.message}</p>}
            <Button disabled={create.isPending}>
              {create.isPending ? 'Zapisywanie…' : 'Utwórz konto'}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
