import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Plus, Search } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, formatMoney } from '../../lib/api';
import { Button, Card, Empty, Field, Input, Select } from '../../components/ui/ui';
import { PageState } from '../shared/PageState';
import type { Account, Category, Transaction } from '../shared/types';
import styles from '../shared/Crud.module.scss';
export function TransactionsPage({ editor = false }: { editor?: boolean }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  useEffect(() => {
    const id = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (search) next.set('search', search);
      else next.delete('search');
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(id);
  }, [search]);
  const query = `?search=${encodeURIComponent(params.get('search') ?? '')}&type=${params.get('type') ?? ''}`;
  const q = useQuery({
    queryKey: ['transactions', query],
    queryFn: () => api<{ data: Transaction[]; meta: { total: number } }>('/transactions' + query),
  });
  const accounts = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api<{ data: Account[] }>('/accounts'),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<{ data: Category[] }>('/categories'),
  });
  const create = useMutation({
    mutationFn: (body: Record<string, string>) =>
      api('/transactions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      void qc.invalidateQueries();
      navigate('/transactions');
    },
  });
  if (editor)
    return (
      <>
        <header>
          <p>
            <Link to="/transactions">← Wróć do listy</Link>
          </p>
          <h1>Nowa transakcja</h1>
          <p>Zapisz wydatek lub przychód z dokładną datą.</p>
        </header>
        <Card className={styles.formCard}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(
                Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>,
              );
            }}
          >
            <div className={styles.twoCols}>
              <Field label="Typ">
                <Select name="type">
                  <option value="EXPENSE">Wydatek</option>
                  <option value="INCOME">Przychód</option>
                </Select>
              </Field>
              <Field label="Konto">
                <Select name="accountId" required>
                  <option value="">Wybierz konto</option>
                  {accounts.data?.data.map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Kwota">
                <Input name="amount" inputMode="decimal" placeholder="0,00" required />
              </Field>
              <Field label="Data">
                <Input
                  name="bookedAt"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </Field>
              <Field label="Opis">
                <Input name="description" required maxLength={240} />
              </Field>
              <Field label="Kategoria">
                <Select name="categoryId">
                  <option value="">Bez kategorii</option>
                  {categories.data?.data.map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {create.error && <p className={styles.error}>{create.error.message}</p>}
            <Button disabled={create.isPending}>
              {create.isPending ? 'Zapisywanie…' : 'Dodaj transakcję'}
            </Button>
          </form>
        </Card>
      </>
    );
  return (
    <>
      <header className={styles.header}>
        <div>
          <h1>Transakcje</h1>
          <p>Pełna historia Twoich przepływów.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/transactions/new">
            <Button>
              <Plus size={17} />
              Dodaj
            </Button>
          </Link>
        </div>
      </header>
      <div className={styles.filters}>
        <label>
          <Search size={17} />
          <Input
            aria-label="Szukaj transakcji"
            placeholder="Szukaj po opisie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Select
          aria-label="Filtruj typ"
          value={params.get('type') ?? ''}
          onChange={(e) => {
            const n = new URLSearchParams(params);
            if (e.target.value) n.set('type', e.target.value);
            else n.delete('type');
            setParams(n);
          }}
        >
          <option value="">Wszystkie typy</option>
          <option value="EXPENSE">Wydatki</option>
          <option value="INCOME">Przychody</option>
          <option value="TRANSFER_OUT">Transfery</option>
        </Select>
      </div>
      <PageState loading={q.isLoading} error={q.error}>
        {q.data?.data.length ? (
          <Card className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Opis</th>
                  <th>Konto</th>
                  <th>Data</th>
                  <th>Kategoria</th>
                  <th>Kwota</th>
                </tr>
              </thead>
              <tbody>
                {q.data.data.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <b>{tx.description}</b>
                      {tx.type.startsWith('TRANSFER') && (
                        <span className={styles.badge}>
                          <ArrowLeftRight size={12} /> transfer
                        </span>
                      )}
                    </td>
                    <td>{tx.account.name}</td>
                    <td>{new Date(tx.bookedAt).toLocaleDateString('pl-PL')}</td>
                    <td>{tx.category?.name ?? '—'}</td>
                    <td
                      className={
                        tx.type === 'INCOME' || tx.type === 'TRANSFER_IN'
                          ? styles.income
                          : styles.expense
                      }
                    >
                      {tx.type === 'INCOME' || tx.type === 'TRANSFER_IN' ? '+' : '−'}
                      {formatMoney(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Empty title="Brak transakcji" description="Dodaj pierwszy wydatek lub przychód." />
        )}
      </PageState>
    </>
  );
}
