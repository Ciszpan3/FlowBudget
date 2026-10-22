---
name: database-change
description: Safely change FlowBudget Prisma and PostgreSQL models, migrations, indexes, and financial integrity. Use whenever persistence shape, constraints, or balance-affecting operations change.
---

# Database change

Before editing, trace all reads and writes of the affected model and state the invariant being preserved. Treat migrations as durable production code.

- Prefer additive, deployable changes. For required fields on populated tables, use expand/backfill/contract rather than a destructive one-step migration.
- Use `DECIMAL(19,2)` for PLN values. Preserve transfer pairing and execute balance-affecting multi-row changes in a serializable transaction.
- Ensure tenant-owned tables carry `userId`; indexes should begin with ownership and follow actual filters/order. Add unique constraints for real domain identities and foreign-key delete behavior deliberately.
- Generate a named migration, inspect its SQL, and reject silent data loss. Never use reset or force flags against a database containing user data.
- Test migration deployment on a disposable database plus ownership, concurrency, edit/delete, and rollback behavior relevant to the change.
- Regenerate Prisma Client and run API typecheck/tests. Update `docs/DATABASE.md` and API docs when externally observable behavior changes.

Stop and request direction if existing data cannot be migrated without choosing a business policy.
