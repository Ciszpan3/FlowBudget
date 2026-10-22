import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Spinner } from '../components/ui/ui';
import { AuthPage } from '../features/auth/AuthPage';
import { Shell } from './Shell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { AccountsPage } from '../features/accounts/AccountsPage';
import { TransactionsPage } from '../features/transactions/TransactionsPage';
import { BudgetsPage } from '../features/budgets/BudgetsPage';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage';
import { ImportPage } from '../features/imports/ImportPage';
import { SavingsPage } from '../features/savings/SavingsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
export function App() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spinner />
      </main>
    );
  if (!user) return <AuthPage />;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/new" element={<TransactionsPage editor />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/imports" element={<ImportPage />} />
        <Route path="/savings" element={<SavingsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
