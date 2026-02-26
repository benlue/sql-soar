# SQL-SOAR Release Notes

## What's New

### v3.0.0
- **Async/Await API (Breaking Change)** — All exported functions now return Promises instead of using callbacks. This is a breaking change for all callers.
  - `soar.query()`, `soar.list()`, `soar.insert()`, `soar.update()`, `soar.del()`, `soar.execute()`, `soar.runSql()`, `soar.getConnection()`, and all schema management functions are now async
  - Pagination with `soar.range()` now returns `{list, count}` instead of passing `(err, list, count)` to a callback
  - Transaction methods (`getConnection`, `beginTransaction`, `commit`, `rollback`) are all async
- **In-Memory Testing** — Tests can now run without external database servers
  - PostgreSQL tests use [PGlite](https://github.com/electric-sql/pglite) (real PostgreSQL compiled to WebAssembly, runs in-process)
  - MySQL tests use [mysql-memory-server](https://github.com/Sebastian-Webster/mysql-memory-server-nodejs) (downloads and runs a real MySQL binary as a child process)
  - Run with `npm run test:pg:mem` and `npm run test:mysql:mem`
- **Package renamed** to `@conwell/sql-soar`

### v2.1.0
- **Column Reference Filters** - Enhanced filter system now supports column-to-column comparisons using `@` prefix notation
  - Use `@column_name` in filter values to reference other columns instead of parameters
  - Works with both MySQL and PostgreSQL databases
  - Example: `{age: '@birth_year'}` generates `WHERE age = birth_year` instead of parameterized queries
  - Supports all operators: `=`, `>`, `<`, `>=`, `<=`, `LIKE`, etc.
  - Compatible with table aliases and complex filter expressions

### v2.0.0
- **PostgreSQL Support** - Major overhaul of the codebase with full PostgreSQL database support
- **Multi-Database Enhancement** - Improved support for mixing MySQL and PostgreSQL databases in the same application
- **SQL Caching Removed** - No longer cache generated SQL statements as the original SQL reuse rule does not fully qualify all possible query conditions
- **Enhanced Test Suite** - Comprehensive test coverage for both MySQL and PostgreSQL databases
- **Schema Management** - Full schema management support for PostgreSQL including table creation, alteration, and deletion

1.3.7
=====
+ No longer cache the generated SQL statements. The original SQL resue rule does not fully qualify all possible query conditions.

1.3.5
=====
+ The total count of a pagination list query will not be cached any more. Such caching could return wrong entry count.
  
1.3.4
=====
+ Fixed a bug which would case paging error when there is no data.

1.3.2
=====

+ Changed the list count query as suggested by mySql.

1.3.1
=====

+ Fixed a minor bug which would fail with the higher versions of nodes.

1.3.0
=====

+ Rewriting codes without changing functionalities.

1.2.4
=====

+ Minor bug fix

1.2.3
=====

+ Databases can be referred by its alias.

+ The SQL command has been further simplified.

+ The syntax of table join in the SQL expression is also simplified.

1.2.2
=====

+ Fixed a bug of the returning total rows when doing pagination.

1.2.1
=====

+ Some minor bug fixes.

1.2.0
=====

+ Supported "stored SQL expressions". Commonly used SQL expressions can be stored as files so they don't have to be rebuilt every time. 

+ Closed down the old connection pools if soar is being re-configured.

+ Fixed the problem that some test cases did not release connections.

1.1.7
=====

+ Bug fix: when doing list query with paging, the total count will always be refreshed.

1.1.6
=====

+ When a list query is requested in "page" mode, the totol count returned may be wrong due to "JOIN" clause. The bug is fixed.

+ The runSql() method did not release connection properly. It's also fixed in this release.

1.1.5
=====

+ Both "table AS alias" or "table alias" would work.

1.1.4
=====

+ Support the IN clause.

+ Rewrite the testQuery test case with the new syntax.

1.1.3
=====

+ Bug fix of the runSql() method. If no database connections or database names are given, the previous version would fail to execute.

1.1.2
=====

+ Added the runSql() method to run SQL statements directly when necessary.

1.1.1
=====

+ Fixed a bug which would cause "date" objects unable to be written to db tables.

1.1.0
=====

+ If you use SQL expressions to do query, part of the generated SQL statements will be cached to give better performance.

+ When you do pagination, total of 2 queries will be issued: one to retrieve the actual data and the other one to get the total count. In the new release, the total count of a query will be cached for future use. You can force sql-soar to renew the count by setting "refresh" to ture in the soar command.

1.0.5
=====

+ Allowing SQL expressions built for table joins can be applied to insert, update and delete as well.

+ Added test cases to verify the new feature.

1.0.4
=====

+ When table columns are not specified in the update or delete operations, the prvious version could inlucde not updated columns and try to set their values to "undefined". This bug has been fixed.

1.0.3
=====

+ Supported query objects as a way of specifying query conditions.

+ Added a [document](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) to describe what is a query object.

1.0.2
=====

+ Pagination supported. Besides returning a page-load of data, **soar** will also return the total count of the query.

1.0.1
=====

+ Fixed a bug in update.

+ Added a test case to verify the bug fix.

1.0.0
=====

+ Officially released
