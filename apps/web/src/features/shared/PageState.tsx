import type { ReactNode } from 'react';
import { Empty, Skeletons } from '../../components/ui/ui';
export function PageState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error?: Error | null;
  empty?: boolean;
  children: ReactNode;
}) {
  if (loading) return <Skeletons />;
  if (error) return <Empty title="Nie udało się pobrać danych" description={error.message} />;
  if (empty)
    return (
      <Empty title="Jeszcze nic tu nie ma" description="Dodaj pierwszy element, aby rozpocząć." />
    );
  return <>{children}</>;
}
