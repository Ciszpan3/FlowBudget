# Baza danych

`User` jest korzeniem danych właściciela. `Session`, `Account`, `Transaction`, `Category`, `Budget`, `ImportBatch` i `CategorizationRule` mają jawne relacje oraz usuwanie zależne dobrane do domeny. Transakcja finansowa nie może stracić konta przez kaskadę; konto jest archiwizowane.

Kwoty mają typ `DECIMAL(19,2)`. Saldo konta to saldo początkowe + `INCOME`/`TRANSFER_IN` − `EXPENSE`/`TRANSFER_OUT`. Transfer ma wspólne `transferGroupId`, powstaje i jest usuwany w transakcji o izolacji `Serializable`; nie wchodzi do przychodów ani wydatków.

Budżet jest unikalny dla `(userId, categoryId, month)`, konto dla `(userId, name)`, reguła dla `(userId, phrase)`, a importowany odcisk dla `(userId, fingerprint)`. Indeksy pokrywają oś czasu użytkownika, konto, kategorię, miesiąc budżetu, sesje i historię importów.

Migracje znajdują się w `apps/api/prisma/migrations`: inicjalna `20261022000000_init` oraz synchronizacja kluczy obcych `20261022151630_sync_schema`. Zmiany schematu wykonuj zgodnie z `.agents/skills/database-change/SKILL.md`; nie używaj resetu na danych użytkownika.
