import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  CreditCard,
  Gauge,
  Import,
  Landmark,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  Settings,
  WalletCards,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './AuthContext';
import styles from './Shell.module.scss';
const nav = [
  ['/', 'Pulpit', Gauge],
  ['/accounts', 'Konta', Landmark],
  ['/transactions', 'Transakcje', ReceiptText],
  ['/budgets', 'Budżety', WalletCards],
  ['/analytics', 'Analizy', BarChart3],
  ['/imports', 'Import CSV', Import],
  ['/savings', 'Oszczędności', PiggyBank],
  ['/settings', 'Ustawienia', Settings],
] as const;
export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className={styles.layout}>
      <button
        className={styles.mobileToggle}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Zamknij menu' : 'Otwórz menu'}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <button
          className={styles.backdrop}
          onClick={() => setOpen(false)}
          aria-label="Zamknij menu"
        />
      )}
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.brand}>
          <span>
            <CreditCard />
          </span>
          <div>
            <b>FlowBudget</b>
            <small>Personal finance</small>
          </div>
        </div>
        <p className={styles.navLabel}>Przestrzeń finansowa</p>
        <nav aria-label="Główna nawigacja">
          {nav.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? styles.active : '')}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.profile}>
          <span className={styles.avatar}>{initials || 'FB'}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
          <button onClick={() => void logout()} aria-label="Wyloguj">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <div key={location.pathname} className={styles.page}>
          {children}
        </div>
      </main>
    </div>
  );
}
