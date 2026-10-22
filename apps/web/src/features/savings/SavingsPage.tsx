import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { simulateSavings } from '@flowbudget/shared';
import { Card, Field, Input } from '../../components/ui/ui';
import { formatMoney } from '../../lib/api';
import styles from './SavingsPage.module.scss';
export function SavingsPage() {
  const [initial, setInitial] = useState('5000');
  const [monthly, setMonthly] = useState('800');
  const [months, setMonths] = useState(24);
  const data = useMemo(() => {
    try {
      return simulateSavings(initial || '0', monthly || '0', months).map((x) => ({
        ...x,
        value: Number(x.amount),
      }));
    } catch {
      return [];
    }
  }, [initial, monthly, months]);
  const final = data.at(-1)?.value ?? 0;
  return (
    <>
      <header>
        <h1>Symulator oszczędności</h1>
        <p>Sprawdź różne scenariusze. To symulacja, nie gwarantowana prognoza.</p>
      </header>
      <div className={styles.layout}>
        <Card className={styles.controls}>
          <h2>Założenia</h2>
          <Field label="Oszczędności na start">
            <Input
              inputMode="decimal"
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
            />
          </Field>
          <Field label="Co miesiąc">
            <Input
              inputMode="decimal"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </Field>
          <Field label={`Horyzont: ${months} mies.`}>
            <input
              className={styles.range}
              type="range"
              min="3"
              max="120"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            />
          </Field>
          <div className={styles.result}>
            <span>Prognozowana suma</span>
            <strong>{formatMoney(final)}</strong>
            <small>
              Wpłacisz łącznie {formatMoney(Number(initial || 0) + Number(monthly || 0) * months)}
            </small>
          </div>
        </Card>
        <Card className={styles.chart}>
          <h2>Twój możliwy postęp</h2>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="sav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#6d8dff" stopOpacity=".42" />
                  <stop offset="1" stopColor="#6d8dff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => formatMoney(Number(v))}
                labelFormatter={(v) => `Miesiąc ${v}`}
                contentStyle={{
                  background: '#172130',
                  border: '1px solid #293548',
                  borderRadius: 12,
                }}
              />
              <Area dataKey="value" stroke="#6d8dff" strokeWidth={3} fill="url(#sav)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
}
