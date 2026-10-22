import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema } from '@flowbudget/shared';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { Button, Field, Input } from '../../components/ui/ui';
import styles from './AuthPage.module.scss';
type Form = { name?: string; email: string; password: string };
export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [serverError, setServerError] = useState('');
  const { authenticate } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Form>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
    defaultValues: { email: '', password: '', name: '' },
  });
  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    reset();
    setServerError('');
  };
  return (
    <main className={styles.page}>
      <section className={styles.story}>
        <div className={styles.logo}>
          <span>F</span>FlowBudget
        </div>
        <div>
          <p className={styles.eyebrow}>
            <Sparkles size={15} /> Finanse bez szumu
          </p>
          <h1>Zobacz, dokąd naprawdę płyną Twoje pieniądze.</h1>
          <p>Jeden spokojny widok na konta, wydatki i cele. Bez arkuszy, chaosu i zgadywania.</p>
        </div>
        <div className={styles.proof}>
          <ShieldCheck />
          <span>Twoje dane finansowe pozostają prywatne i odizolowane.</span>
        </div>
      </section>
      <section className={styles.formSide}>
        <form
          onSubmit={handleSubmit(async (data) => {
            try {
              setServerError('');
              await authenticate(mode, data as Record<string, string>);
            } catch (e) {
              setServerError(e instanceof Error ? e.message : 'Nie udało się kontynuować');
            }
          })}
        >
          <header>
            <p>{mode === 'login' ? 'Witaj ponownie' : 'Dobry początek'}</p>
            <h2>{mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}</h2>
          </header>
          {mode === 'register' && (
            <Field label="Imię" error={errors.name?.message}>
              <Input autoComplete="name" {...register('name')} />
            </Field>
          )}
          <Field label="Adres e-mail" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Field label="Hasło" error={errors.password?.message}>
            <Input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              {...register('password')}
            />
          </Field>
          {serverError && (
            <p className={styles.error} role="alert">
              {serverError}
            </p>
          )}
          <Button disabled={isSubmitting}>
            {isSubmitting ? 'Chwila…' : mode === 'login' ? 'Zaloguj się' : 'Załóż konto'}
            <ArrowRight size={17} />
          </Button>
          <p className={styles.switch}>
            {mode === 'login' ? 'Nie masz jeszcze konta?' : 'Masz już konto?'}{' '}
            <button type="button" onClick={switchMode}>
              {mode === 'login' ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
