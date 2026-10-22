# Architektura

FlowBudget jest modularnym monolitem w monorepo. Przeglądarka komunikuje się przez REST z jedną aplikacją Express, a ta z PostgreSQL przez Prisma. Taki układ upraszcza lokalne uruchomienie i transakcje finansowe, bez blokowania późniejszego podziału modułów.

## Moduły

- `auth`: rejestracja, sesje i lifecycle cookie;
- `accounts`: konta i saldo obliczane z salda początkowego oraz operacji;
- `transactions`: przychody, wydatki i atomowe pary transferów;
- `categories`: kategorie i uporządkowane reguły dopasowania;
- `budgets`: limity kategorii dla miesiąca;
- `analytics`: agregacje serwerowe i trendy PostgreSQL;
- `imports`: bezstanowy podgląd CSV oraz atomowe zatwierdzenie.

Frontend ma analogiczne funkcje biznesowe, wspólne prymitywy UI i cienką warstwę `lib/api`. TanStack Query jest jedynym cache danych serwera. AuthContext przechowuje wyłącznie bieżącą tożsamość i sekret CSRF w pamięci.

## Przepływ

Zod waliduje wejście na granicy. Middleware odczytuje nieprzezroczysty token cookie, hashuje go SHA-256 i pobiera sesję. Wszystkie moduły otrzymują `userId` z sesji, nigdy z body. Mutacje wymagają nagłówka CSRF. Odpowiedzi mają kształt `{ data }`, a błędy `{ error: { code, message, details? } }`.

Najważniejsze decyzje: brak JWT/localStorage, brak cache salda podatnego na rozjazd, `Decimal` w bazie, `bigint` w czystych obliczeniach, transfer jako dwie powiązane operacje, agregacje analityczne w bazie i brak dedykowanego adaptera iPKO bez zweryfikowanej próbki.
