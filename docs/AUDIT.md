# Audyt FlowBudget

Data: 22 października 2026. Zakres: architektura, bezpieczeństwo, baza danych, frontend, testy, dokumentacja i zależności.

## Wynik

Gotowość: **V1 gotowe do lokalnego developmentu; warunkowo gotowe do wdrożenia po rozszerzeniu automatycznych testów integracyjnych i skonfigurowaniu produkcyjnych sekretów/TLS**.

## Wykonane komendy

- `pnpm install`, `pnpm db:generate` — sukces, Prisma Client 6.19.3;
- `pnpm format:check` — sukces;
- `pnpm typecheck` — sukces dla shared, API i web;
- `pnpm lint` — sukces;
- `pnpm test` — sukces: 4 testy w 3 plikach (matematyka kwot/symulator, normalizacja CSV, komponent symulatora);
- `pnpm build` — sukces dla wszystkich workspace'ów;
- `pnpm test:e2e` — sukces: 1 test Chromium ekranu logowania;
- `pnpm audit --audit-level moderate` — sukces, brak znanych podatności;
- `quick_validate.py` dla trzech `.agents/skills/*` — trzy sukcesy;
- `docker compose up -d postgres`, `pnpm db:migrate`, `pnpm db:seed` — sukces na PostgreSQL 17;
- test API na żywo — health, logowanie kontem demonstracyjnym i izolowany odczyt kont zakończone sukcesem.

## Ustalenia i naprawy

| Severity | Problem                                                                          | Status                                                                        |
| -------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Critical | podatne Vitest/Tinypool w zależnościach deweloperskich                           | naprawiono aktualizacją Vitest 5                                              |
| High     | podatności React Router (XSS/DoS), Multer (DoS), Vite i rate limitera            | naprawiono aktualizacjami i ponownym audytem                                  |
| High     | podatny `deepmerge-ts` w narzędziach Prisma 6                                    | naprawiono kontrolowanym workspace override ≥8 i zweryfikowano generate/build |
| Moderate | podatny `csv-parse`                                                              | naprawiono wersją 7.0.2 i ponownym testem parsera                             |
| High     | wylogowanie omijało globalny CSRF przez kolejność montowania routera             | dodano lokalny `csrfProtection` na trasie                                     |
| High     | lokalny PostgreSQL zajmował `localhost:5432`, kierując Prismę poza kontener      | kontener FlowBudget przeniesiono na port hosta `5433`                         |
| High     | backend Node nie ładował pliku `apps/api/.env`, choć robiło to Prisma CLI        | dodano kontrolowane `loadEnvFile()` przed walidacją Zod                       |
| Medium   | początkowy wykres dashboardu miał dane demonstracyjne                            | zastąpiono zapytaniem do rzeczywistego endpointu trendów                      |
| Low      | jeden bundle web ma 753 kB (228 kB gzip)                                         | pozostaje; lazy-loading tras zaplanowany do V2                                |
| Low      | ostrzeżenie kompatybilności Vite `optimizeDeps.rollupOptions` pochodzi z pluginu | pozostaje; nie wpływa na build                                                |

## Przegląd techniczny

Architektura zachowuje podział domen, cienkie route handlers i wspólne kontrakty tylko tam, gdzie są współdzielone. Nie wprowadzono globalnego client state, mikroserwisów ani zbędnych warstw.

Bezpieczeństwo: hasła Argon2id, losowe nieprzezroczyste sesje przechowywane po hashu, HttpOnly/SameSite/Secure, CSRF, Helmet, CORS do jednego originu, limity requestów/uploadu, generyczne komunikaty rejestracji oraz konsekwentny `userId` przeciw IDOR. Surowe CSV i opisy transakcji nie są logowane.

Baza: `DECIMAL(19,2)`, jawne relacje/indeksy/unikalności, transfer jako dwie operacje w serializable transaction, brak wpływu transferów na przychody/wydatki. Saldo jest wyliczane, więc edycja/usunięcie nie może pozostawić zdenormalizowanej wartości.

Frontend: responsywne widoki, semantyczne formularze, focus states, reduced motion, loading/error/empty states, motyw jasny/ciemny i SCSS Modules. Filtry transakcji są utrzymywane w URL.

## Ograniczenia środowiska i pozostałe ryzyko

PostgreSQL 17 działał w Dockerze, obie migracje i seed zostały wykonane, a połączenie API sprawdzono na żywo. Nadal brakuje pełnego automatycznego zestawu integracyjnego dla każdej operacji CRUD, IDOR i współbieżnych transferów oraz pełnych ścieżek E2E po zalogowaniu; CI jest przygotowane z usługą PostgreSQL do ich dalszego rozszerzenia.

OpenAPI opisuje główne grupy, ale nie jest jeszcze kompletnym katalogiem każdego body/response. Adapter iPKO celowo nie powstał bez zweryfikowanej, zanonimizowanej próbki. Przed produkcją należy ustawić HTTPS, poprawny `WEB_ORIGIN`, reverse proxy/trust proxy, rotację sekretów infrastruktury i backup PostgreSQL.
