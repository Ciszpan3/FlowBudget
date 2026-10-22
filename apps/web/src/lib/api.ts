const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
let csrfToken = '';
export const setCsrf = (value: string) => {
  csrfToken = value;
};
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (csrfToken && options.method && !['GET', 'HEAD'].includes(options.method))
    headers.set('x-csrf-token', csrfToken);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? 'Nie udało się połączyć z serwerem.');
  return body as T;
}
export const money = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
});
export const formatMoney = (value: string | number) => money.format(Number(value));
