# Release Notes

## v3.1.0 — 2026-03-13

- Added `.orderBy()` to the SQL expression API for structured ORDER BY generation, replacing the need to hard-code ORDER BY via `.extra()`.
- PostgreSQL ORDER BY columns are now properly double-quoted to preserve case.
- Fixed `describeTable()` for PostgreSQL to filter by `current_schema()`, so tables in non-public schemas are correctly discovered.
- Fixed `DBManager.init()` to handle non-serializable config options (e.g. pre-created pool instances).

## v3.0.4 — 2026-03-03

- Fixed schema operations (`createTable`, `alterTable`, `deleteTable`, `renameTable`, `describeTable`) to use the correct database-specific schema manager per connection, enabling mixed-database setups (e.g., MySQL + PostgreSQL simultaneously).

## v3.0.3 — 2026-03-03

- Added `searchPath` and `role` support in PostgreSQL `dbConfig` for multi-tenant schema isolation.
- `SET search_path` and `SET ROLE` are executed on every connection checkout, ensuring correct behavior with PgBouncer in transaction pooling mode.

## v3.0.2 — 2026-03-03

- Fixed `DBManager.init()` cleanup: the guard condition was inverted (`=== 0` instead of `> 0`), so old connection pools and schema caches were never cleaned up on re-initialization.
- Fixed `DBManager.init()` to reset `useDB` and `_dftName` so stale database entries do not persist across re-initialization.
- Added duplicate-init bypass: `init()` now skips re-initialization when called with the same options as the previous call.

## v3.0.1 — 2026-02-27

- Fixed schema cache not being invalidated after `alterTable()`, `deleteTable()`, and `renameTable()`, which could cause subsequent queries to use stale schema information.
- Added `soar.invalidateSchemaCache(tableName)` public API for manual cache invalidation after raw SQL schema changes.
- Enhanced `runSql()` to automatically convert `?` placeholders to PostgreSQL's `$N` format, allowing the same parameterized SQL to work across both MySQL and PostgreSQL.
- Enhanced `runSql()` to accept a connection object as the first argument, enabling raw SQL execution within transactions.
- Normalized `runSql()` result format to consistently return rows for both MySQL and PostgreSQL.
- Added `_dbType` tagging on connections from both MySQL and PostgreSQL pools.
- Added `beginTransaction()`, `commit()`, and `rollback()` convenience methods on PostgreSQL connections.
