import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Button, Card, Field, Input, Select } from '../../components/ui/ui';
import type { Category } from '../shared/types';
import styles from './SettingsPage.module.scss';

type Rule = { id: string; phrase: string; priority: number; category: Category };

export function SettingsPage() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') ?? 'dark');
  const queryClient = useQueryClient();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<{ data: Category[] }>('/categories'),
  });
  const rules = useQuery({
    queryKey: ['rules'],
    queryFn: () => api<{ data: Rule[] }>('/categories/rules'),
  });
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/categories/rules', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/categories/rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['rules'] }),
  });

  return (
    <>
      <header>
        <h1>Ustawienia</h1>
        <p>Dopasuj wygląd i automatyczną kategoryzację.</p>
      </header>
      <div className={styles.grid}>
        <Card>
          <h2>Wygląd</h2>
          <p>Motyw interfejsu jest zapisywany tylko w tej przeglądarce.</p>
          <div className={styles.themes}>
            <button
              className={theme === 'light' ? styles.selected : ''}
              onClick={() => setTheme('light')}
            >
              <i className={styles.light} />
              <span>Jasny</span>
            </button>
            <button
              className={theme === 'dark' ? styles.selected : ''}
              onClick={() => setTheme('dark')}
            >
              <i className={styles.dark} />
              <span>Ciemny</span>
            </button>
          </div>
        </Card>
        <Card>
          <h2>Reguły kategoryzacji</h2>
          <p>Opis zawierający frazę otrzyma wybraną kategorię przy imporcie.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              create.mutate({
                phrase: data.get('phrase'),
                categoryId: data.get('categoryId'),
                priority: 100,
              });
              form.reset();
            }}
          >
            <Field label="Fraza">
              <Input name="phrase" placeholder="np. Biedronka" required />
            </Field>
            <Field label="Kategoria">
              <Select name="categoryId" required>
                <option value="">Wybierz</option>
                {categories.data?.data.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button>
              <Plus size={16} />
              Dodaj regułę
            </Button>
          </form>
          <div className={styles.rules}>
            {rules.data?.data.map((rule) => (
              <div key={rule.id}>
                <span>
                  <b>{rule.phrase}</b>
                  <small>→ {rule.category.name}</small>
                </span>
                <button
                  onClick={() => remove.mutate(rule.id)}
                  aria-label={`Usuń regułę ${rule.phrase}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
