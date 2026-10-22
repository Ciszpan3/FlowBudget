# FlowBudget

FlowBudget to pełnostackowa aplikacja do codziennego zarządzania finansami osobistymi. Interfejs i dokumentacja produktu są po polsku, a operacje finansowe korzystają z precyzyjnego typu dziesiętnego zamiast arytmetyki zmiennoprzecinkowej.

## Funkcje

- rejestracja, logowanie i sesje HttpOnly z Argon2id, CSRF i rate limitingiem;
- konta bankowe, gotówkowe i oszczędnościowe z saldem wyliczanym z operacji;
- przychody, wydatki, transfery, kategorie, wyszukiwanie i filtrowanie;
- miesięczne budżety kategorii i informacje o przekroczeniach;
- pulpit, trendy i agregacje wykonywane po stronie PostgreSQL;
- CSV: mapowanie, separator/encoding, podgląd, reguły kategorii, pomijanie i deduplikacja;
- symulator oszczędności oparty na groszach `bigint`;
- responsywny interfejs, dostępność klawiatury i jasny/ciemny motyw.

## Stack

React 19, TypeScript strict, Vite 8, React Router, TanStack Query, React Hook Form, Zod, Recharts, SCSS Modules; Node.js, Express 5, PostgreSQL 17, Prisma 6; Vitest, Testing Library, Supertest i Playwright. Monorepo używa pnpm workspaces.

## Uruchomienie

Wymagane: Node.js 22.12+ (zalecany 24), pnpm 11+, Docker Desktop.

```bash
Copy-Item .env.example apps/api/.env
pnpm install
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Frontend: `http://localhost:5173`, API: `http://localhost:4000`, OpenAPI: `http://localhost:4000/openapi.json`. PostgreSQL kontenera jest mapowany na port hosta `5433`, aby nie kolidował z typową lokalną instalacją na `5432`. Seed tworzy lokalne konto `demo@flowbudget.local` / `ZAQ!2wsx`; nie używaj tego hasła poza środowiskiem lokalnym.

## Jakość

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm audit:deps
```

Test E2E wymaga jednorazowo `pnpm --filter @flowbudget/web exec playwright install chromium`. Migracje produkcyjne uruchamiaj przez `pnpm --filter @flowbudget/api prisma migrate deploy`.

## Struktura

```text
apps/web          React, funkcje biznesowe i SCSS Modules
apps/api          Express, moduły API, Prisma i migracje
packages/shared   wspólne schematy Zod, typy i matematyka kwot
fixtures          wyłącznie syntetyczne CSV
docs              architektura, baza, API, importy, roadmapa i audyt
.agents/skills    trzy workflowy dla dalszego rozwoju
```

Aktualny stan: działające V1 i produkcyjny build. Testy jednostkowe i E2E ekranu wejścia przechodzą; pełne testy integracyjne z bazą wymagają działającego PostgreSQL. Szczegóły i znane ograniczenia są w [audycie](docs/AUDIT.md).
