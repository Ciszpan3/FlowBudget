---
name: csv-importer
description: Add or modify FlowBudget bank CSV import adapters, mapping, encoding, normalization, deduplication, preview, and fixtures. Use for CSV ingestion work; require a verified synthetic structure before creating a bank-specific adapter.
---

# CSV importer

Work from a sanitized or synthetic sample whose columns, delimiter, encoding, date notation, amount signs, and quoting behavior are known. If a named bank format is unverified, keep the generic mapper and request a redacted sample instead of guessing an adapter.

Keep parsing separate from committing. Preview must expose normalized rows and validation errors without persisting transactions. Commit only the rows the user accepted.

- Cap upload size and record count; accept only intended text formats and decode UTF-8 or explicitly selected legacy encoding.
- Normalize dates to ISO and amounts to two-decimal strings without floating-point aggregation. Make debit/credit sign rules explicit.
- Categorize with the user's ordered rules, while keeping the preview editable.
- Fingerprint normalized date, amount, description, user, and target account. Enforce uniqueness in the database and recheck duplicates inside a serializable commit.
- Never log or retain raw file contents. Store only batch metadata, accepted normalized transactions, counts, and safe error summaries.
- Add synthetic fixtures for valid input, malformed rows, quoting, encoding, duplicates, and edge amounts. Test parser behavior and atomic API authorization.

Document adapter assumptions and mapping changes in `docs/IMPORTS.md`.
