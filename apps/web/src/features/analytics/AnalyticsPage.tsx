import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, formatMoney } from '../../lib/api';
import { Card } from '../../components/ui/ui';
import { PageState } from '../shared/PageState';
import styles from './AnalyticsPage.module.scss';
type Trend = { month: string; income: string; expenses: string };
export function AnalyticsPage() {
  const q = useQuery({
    queryKey: ['trends'],
    queryFn: () => api<{ data: Trend[] }>('/analytics/trends?months=12'),
  });
  const data =
    q.data?.data.map((x) => ({
      ...x,
      label: new Date(`${x.month}-01`).toLocaleDateString('pl-PL', { month: 'short' }),
      income: Number(x.income),
      expenses: Number(x.expenses),
    })) ?? [];
  const income = data.reduce((a, x) => a + x.income, 0),
    expenses = data.reduce((a, x) => a + x.expenses, 0);
  return (
    <>
      <header>
        <h1>Analizy</h1>
        <p>Trendy pomagają zauważyć zmianę, zanim stanie się problemem.</p>
      </header>
      <PageState loading={q.isLoading} error={q.error}>
        <div className={styles.metrics}>
          <Card>
            <span>Przychody w okresie</span>
            <strong>{formatMoney(income)}</strong>
          </Card>
          <Card>
            <span>Wydatki w okresie</span>
            <strong>{formatMoney(expenses)}</strong>
          </Card>
          <Card>
            <span>Bilans</span>
            <strong className={income - expenses >= 0 ? styles.good : ''}>
              {formatMoney(income - expenses)}
            </strong>
          </Card>
        </div>
        <Card>
          <h2>Miesięczny przepływ</h2>
          <p className={styles.muted}>Porównanie przychodów i wydatków z ostatnich 12 miesięcy.</p>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={data} barGap={5}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => formatMoney(Number(v))}
                contentStyle={{
                  background: '#172130',
                  border: '1px solid #293548',
                  borderRadius: 12,
                }}
                cursor={{ fill: 'rgba(109, 141, 255, .06)' }}
              />
              <Legend />
              <Bar name="Przychody" dataKey="income" fill="#48c7a0" radius={[6, 6, 0, 0]} />
              <Bar name="Wydatki" dataKey="expenses" fill="#6d8dff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </PageState>
    </>
  );
}
