import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { api, formatMoney } from '../../lib/api';
import { Button, Card, Empty, Field, Select } from '../../components/ui/ui';
import type { Account, Category } from '../shared/types';
import styles from './ImportPage.module.scss';
type Row = {
  date: string;
  description: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId?: string | null;
  skip?: boolean;
};
type Batch = {
  id: string;
  filename: string;
  importedCount: number;
  skippedCount: number;
  createdAt: string;
};
export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const qc = useQueryClient();
  const accounts = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api<{ data: Account[] }>('/accounts'),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<{ data: Category[] }>('/categories'),
  });
  const history = useQuery({
    queryKey: ['imports'],
    queryFn: () => api<{ data: Batch[] }>('/imports'),
  });
  const preview = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Wybierz plik.');
      const body = new FormData();
      body.set('file', file);
      body.set('encoding', 'utf-8');
      body.set('mapping', JSON.stringify({ date: 'Data', description: 'Opis', amount: 'Kwota' }));
      return api<{ data: Row[] }>('/imports/preview', { method: 'POST', body });
    },
    onSuccess: (r) => setRows(r.data),
  });
  const commit = useMutation({
    mutationFn: () =>
      api('/imports/commit', {
        method: 'POST',
        body: JSON.stringify({ accountId, filename: file?.name ?? 'import.csv', rows }),
      }),
    onSuccess: () => {
      setRows([]);
      setFile(null);
      void qc.invalidateQueries();
    },
  });
  return (
    <>
      <header>
        <h1>Import CSV</h1>
        <p>Bezpiecznie przenieś historię bankową, sprawdź ją i dopiero potem zatwierdź.</p>
      </header>
      {!rows.length ? (
        <Card className={styles.upload}>
          <FileSpreadsheet size={42} />
          <h2>Dodaj plik historii</h2>
          <p>CSV do 2 MB, UTF-8 lub Windows-1250. Oczekiwane kolumny: Data, Opis, Kwota.</p>
          <Field label="Konto docelowe">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Wybierz konto</option>
              {accounts.data?.data.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <label className={styles.drop}>
            <Upload size={18} />
            <span>{file?.name ?? 'Wybierz plik CSV'}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {preview.error && <p className={styles.error}>{preview.error.message}</p>}
          <Button
            disabled={!file || !accountId || preview.isPending}
            onClick={() => preview.mutate()}
          >
            {preview.isPending ? 'Analizuję…' : 'Pokaż podgląd'}
          </Button>
        </Card>
      ) : (
        <>
          <div className={styles.previewHead}>
            <div>
              <h2>Podgląd: {file?.name}</h2>
              <p>{rows.filter((x) => !x.skip).length} rekordów do importu</p>
            </div>
            <div>
              <Button variant="secondary" onClick={() => setRows([])}>
                Wróć
              </Button>
              <Button disabled={commit.isPending} onClick={() => commit.mutate()}>
                <CheckCircle2 size={17} />
                Zatwierdź import
              </Button>
            </div>
          </div>
          <Card className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Importuj</th>
                  <th>Data</th>
                  <th>Opis</th>
                  <th>Typ</th>
                  <th>Kategoria</th>
                  <th>Kwota</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.date}-${i}`} className={row.skip ? styles.skipped : ''}>
                    <td>
                      <input
                        aria-label={`Importuj ${row.description}`}
                        type="checkbox"
                        checked={!row.skip}
                        onChange={() =>
                          setRows(rows.map((r, j) => (j === i ? { ...r, skip: !r.skip } : r)))
                        }
                      />
                    </td>
                    <td>{row.date}</td>
                    <td>{row.description}</td>
                    <td>{row.type === 'INCOME' ? 'Przychód' : 'Wydatek'}</td>
                    <td>
                      <Select
                        value={row.categoryId ?? ''}
                        onChange={(e) =>
                          setRows(
                            rows.map((r, j) =>
                              j === i ? { ...r, categoryId: e.target.value || null } : r,
                            ),
                          )
                        }
                      >
                        <option value="">—</option>
                        {categories.data?.data.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>{formatMoney(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
      <section className={styles.history}>
        <h2>Historia importów</h2>
        {history.data?.data.length ? (
          history.data.data.map((x) => (
            <Card key={x.id}>
              <FileSpreadsheet />
              <span>
                <b>{x.filename}</b>
                <small>{new Date(x.createdAt).toLocaleString('pl-PL')}</small>
              </span>
              <strong>{x.importedCount} dodanych</strong>
            </Card>
          ))
        ) : (
          <Empty
            title="Brak importów"
            description="Twoje zatwierdzone importy pojawią się tutaj."
          />
        )}
      </section>
    </>
  );
}
