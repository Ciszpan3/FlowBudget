import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react';
import styles from './ui.module.scss';
export function Button({
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button {...props} className={`${styles.button} ${styles[variant]} ${props.className ?? ''}`} />
  );
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${styles.input} ${props.className ?? ''}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${styles.input} ${props.className ?? ''}`} />;
}
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
      {error && <small role="alert">{error}</small>}
    </label>
  );
}
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}
export function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.empty}>
      <span aria-hidden>◎</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Spinner() {
  return <span className={styles.spinner} role="status" aria-label="Ładowanie" />;
}
export function Skeletons() {
  return (
    <div className={styles.skeletonGrid} aria-label="Ładowanie danych" role="status">
      {[0, 1, 2].map((item) => (
        <div className={styles.skeleton} key={item} />
      ))}
    </div>
  );
}
