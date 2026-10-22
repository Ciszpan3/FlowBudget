# API

API jest dostępne pod `/api`; specyfikacja OpenAPI pod `/openapi.json`. Zasoby używają liczby mnogiej, JSON i statusów 200/201/204/400/401/403/404/429/500. Listy transakcji zwracają `{ data, meta: { page, pageSize, total, pages } }`.

Sesja używa cookie `flowbudget_session` (`HttpOnly`, `SameSite=Strict`, `Secure` na produkcji). `GET /api/auth/session` zwraca token CSRF trzymany wyłącznie w pamięci przeglądarki; każda mutacja po zalogowaniu wymaga `x-csrf-token`.

Główne grupy: `/auth`, `/accounts`, `/transactions`, `/budgets`, `/categories`, `/analytics`, `/imports`. Każdy endpoint finansowy ogranicza dane do użytkownika z sesji. Komunikaty błędów nie ujawniają istnienia e-maila podczas rejestracji.
