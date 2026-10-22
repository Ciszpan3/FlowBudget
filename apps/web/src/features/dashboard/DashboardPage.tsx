import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet, type LucideIcon } from 'lucide-react';
import { api, formatMoney } from '../../lib/api';
import { Card } from '../../components/ui/ui';
import { PageState } from '../shared/PageState';
import type { Transaction } from '../shared/types';
import styles from './DashboardPage.module.scss';

type Data = {
  summary: { balance: string; income: string; expenses: string; net: string; savingsRate: string };
  categories: { id: string; name: string; color: string; value: string }[];
  recent: Transaction[];
  budgets: unknown[];
};
type Trend = { month: string; income: string; expenses: string };

export function DashboardPage() {
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<{ data: Data }>('/analytics/dashboard'),
  });
  const trends = useQuery({
    queryKey: ['trends', 6],
    queryFn: () => api<{ data: Trend[] }>('/analytics/trends?months=6'),
  });
  const summary: Array<[string, string, LucideIcon, boolean]> = dashboard.data
    ? [
        ['Łączne saldo', dashboard.data.data.summary.balance, Wallet, false],
        ['Przychody w tym miesiącu', dashboard.data.data.summary.income, ArrowUpRight, false],
        ['Wydatki w tym miesiącu', dashboard.data.data.summary.expenses, ArrowDownRight, false],
        ['Stopa oszczędzania', `${dashboard.data.data.summary.savingsRate}%`, PiggyBank, true],
      ]
    : [];
  const chartData =
    trends.data?.data.map((item) => ({
      ...item,
      label: new Date(`${item.month}-01`).toLocaleDateString('pl-PL', { month: 'short' }),
      income: Number(item.income),
      expenses: Number(item.expenses),
    })) ?? [];
  return (
    <>
      <header>
        <p className={styles.kicker}>Twój obraz finansów</p>
        <h1>Dzień dobry 👋</h1>
        <p>Sprawdź, jak pracują dziś Twoje pieniądze.</p>
      </header>
      <PageState loading={dashboard.isLoading} error={dashboard.error}>
        <div className={styles.summary}>
          {summary.map(([label, value, Icon, percent]) => (
            <Card key={label} className={styles.metric}>
              <div className={styles.metricIcon}>
                <Icon size={19} />
              </div>
              <span>{label}</span>
              <strong>{percent ? value : formatMoney(value)}</strong>
            </Card>
          ))}
        </div>
        <div className={styles.grid}>
          <Card className={styles.chart}>
            <div className={styles.cardHead}>
              <div>
                <span>Przepływy</span>
                <h2>Przychody i wydatki</h2>
              </div>
              <small>6 miesięcy</small>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#6d8dff" stopOpacity=".4" />
                    <stop offset="1" stopColor="#6d8dff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => formatMoney(Number(value))}
                  contentStyle={{
                    background: '#172130',
                    border: '1px solid #293548',
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#6d8dff"
                  fill="url(#inc)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#48c7a0"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card className={styles.categories}>
            <div className={styles.cardHead}>
              <div>
                <span>Struktura</span>
                <h2>Gdzie płyną pieniądze</h2>
              </div>
            </div>
            {dashboard.data?.data.categories.length ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={dashboard.data.data.categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {dashboard.data.data.categories.map((item) => (
                        <Cell key={item.id} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatMoney(String(value))}
                      contentStyle={{
                        background: '#172130',
                        border: '1px solid #293548',
                        borderRadius: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul>
                  {dashboard.data.data.categories.map((item) => (
                    <li key={item.id}>
                      <i style={{ background: item.color }} />
                      <span>{item.name}</span>
                      <b>{formatMoney(item.value)}</b>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={styles.muted}>Kategorie pojawią się po dodaniu wydatków.</p>
            )}
          </Card>
          <Card className={styles.recent}>
            <div className={styles.cardHead}>
              <div>
                <span>Ostatnia aktywność</span>
                <h2>Transakcje</h2>
              </div>
            </div>
            {dashboard.data?.data.recent.length ? (
              <div className={styles.txList}>
                {dashboard.data.data.recent.map((tx) => (
                  <div key={tx.id}>
                    <i style={{ background: tx.category?.color ?? 'var(--surface-2)' }}>
                      {tx.description[0]?.toUpperCase()}
                    </i>
                    <span>
                      <b>{tx.description}</b>
                      <small>
                        {tx.account.name} · {new Date(tx.bookedAt).toLocaleDateString('pl-PL')}
                      </small>
                    </span>
                    <strong className={tx.type === 'INCOME' ? styles.positive : ''}>
                      {tx.type === 'INCOME' ? '+' : '−'}
                      {formatMoney(tx.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>
                Brak transakcji. Dodaj pierwszą, aby zobaczyć przepływy.
              </p>
            )}
          </Card>
        </div>
      </PageState>
    </>
  );
}
