# FlowBudget — instrukcje dla agentów

FlowBudget to polskojęzyczna aplikacja finansów osobistych w monorepo pnpm: `apps/web` (React/Vite), `apps/api` (Express/Prisma) oraz `packages/shared` (kontrakty Zod i bezpieczna matematyka kwot).

## Zasady pracy

- Organizuj kod według funkcji biznesowych. Nie przenoś kodu specyficznego dla jednej aplikacji do `shared`.
- TypeScript pozostaje w trybie strict. Frontend używa TanStack Query dla danych serwera i SCSS Modules dla komponentów.
- Kwoty zapisuj jako PostgreSQL `DECIMAL(19,2)` / Prisma `Decimal`; w logice bez bazy używaj groszy `bigint`. Nigdy nie sumuj pieniędzy typem `number`.
- Każde zapytanie do danych użytkownika musi zawierać `userId`. Sprawdzaj własność także zasobów powiązanych; nie ufaj identyfikatorom z klienta.
- Mutacje wymagają sesji HttpOnly oraz nagłówka CSRF. Nie loguj haseł, zawartości CSV ani opisów transakcji.
- Zmiany Prisma wymagają migracji, właściwych indeksów, oceny integralności i aktualizacji `docs/DATABASE.md`.
- Komponenty muszą mieć stany loading/error/empty, semantyczny HTML, widoczny focus i obsługę telefonu. Nie dodawaj CSS-in-JS ani globalnych styli komponentów.
- Testuj reguły finansowe i parsery jednostkowo; API, autoryzację i IDOR integracyjnie; kluczowe ścieżki użytkownika E2E.

Definition of Done: walidacja wejścia, autoryzacja, test adekwatny do ryzyka, działający lint/typecheck/build, aktualna dokumentacja i brak sekretów. W repozytorium są pomocnicze skills: `create-feature`, `database-change`, `csv-importer`.
