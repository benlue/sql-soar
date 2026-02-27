# Release Notes

## v3.0.1 — 2026-02-27

- Fixed schema cache not being invalidated after `alterTable()`, `deleteTable()`, and `renameTable()`, which could cause subsequent queries to use stale schema information.
- Added `soar.invalidateSchemaCache(tableName)` public API for manual cache invalidation after raw SQL schema changes.
- Enhanced `runSql()` to automatically convert `?` placeholders to PostgreSQL's `$N` format, allowing the same parameterized SQL to work across both MySQL and PostgreSQL.
- Enhanced `runSql()` to accept a connection object as the first argument, enabling raw SQL execution within transactions.
- Normalized `runSql()` result format to consistently return rows for both MySQL and PostgreSQL.
- Added `_dbType` tagging on connections from both MySQL and PostgreSQL pools.
- Added `beginTransaction()`, `commit()`, and `rollback()` convenience methods on PostgreSQL connections.
