# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SQL-SOAR is a lightweight Node.js module that bridges object-oriented programming and relational databases. It provides full SQL control while eliminating repetitive hand-coding through JSON-based SQL expressions. The project supports both MySQL and PostgreSQL databases.

## Development Commands

### Testing
- `npm test` - Run all tests (MySQL + PostgreSQL + shared)
- `npm run test:mysql` - Run MySQL-specific tests only
- `npm run test:postgresql` - Run PostgreSQL-specific tests only
- `npm run test:shared` - Run shared functionality tests
- `npm run test:simple` - Quick test using PostgreSQL testQuery.js
- `npm run test:all` - Alias for full test suite

### Database Setup (using Podman/Docker)
**PostgreSQL:**
- `npm run start:postgres` - Start PostgreSQL test container
- `npm run setup:postgres` - Initialize schema and sample data
- `npm run stop:postgres` - Stop and remove container

**MySQL:**
- `npm run start:mysql` - Start MySQL test container
- `npm run setup:mysql` - Initialize schema and sample data
- `npm run stop:mysql` - Stop and remove container

### Running Individual Tests
- `mocha test/postgresql/testQuery.js --timeout 10000`
- `mocha test/mysql/*.js --timeout 10000`
- Manual tests: `node test/manual/mysql/mysqlDataTypeMappingTest.js`

## Architecture Overview

### Core Components

**Main Entry Point:**
- `lib/soar.js` - Primary API interface, exports all main functions (config, query, list, insert, update, del, execute, etc.)

**Database Management:**
- `lib/core/DBManager.js` - Database connection management and initialization
- `lib/core/DBConnMySQL.js` - MySQL-specific connection handling
- `lib/core/DBConnPostgreSQL.js` - PostgreSQL-specific connection handling
- `lib/core/sqlEngine.js` - Core SQL execution engine with database-agnostic query processing

**SQL Generation:**
- `lib/sql/sqlComp.js` - SQL expression composition (filters, joins, columns)
- `lib/sql/sqlGenMySql.js` - MySQL-specific SQL generation
- `lib/sql/sqlGenPostgreSQL.js` - PostgreSQL-specific SQL generation

**Schema Management:**
- `lib/mysqlSchemaManager.js` - MySQL table creation/modification
- `lib/postgreSchemaManager.js` - PostgreSQL table creation/modification

### Key Architecture Patterns

**Multi-Database Support:**
- Database type detection via explicit `type` field, port 5432 for PostgreSQL, or MySQL default
- Database-specific connection classes handle driver differences
- SQL generators abstract database-specific syntax differences

**SQL Expression System:**
- JSON-based query composition via `soar.sql(table).column().filter().join()`
- Expressions can be stored as files and reused
- Auto-fill missing schema information from database metadata

**Command Execution Flow:**
1. `soar.execute()` → `sqlEngine.execute()`
2. Parse table name for multi-DB routing (`db.table` syntax)
3. Auto-fill missing columns/filters using table schema
4. Generate database-specific SQL
5. Execute with connection pooling
6. Transform results if needed

### Database Configuration

**Single Database:**
```javascript
soar.config({
    dbConfig: {
        type: "postgresql", // or "mysql"
        host: "localhost",
        database: "myapp",
        user: "user",
        password: "pass"
    }
});
```

**Multi-Database:**
```javascript
soar.config([
    { dbConfig: { alias: "main_db", type: "mysql", ... } },
    { dbConfig: { alias: "analytics_db", type: "postgresql", ... } }
]);
```

## Testing Structure

- `test/mysql/` - MySQL-specific functionality tests
- `test/postgresql/` - PostgreSQL-specific functionality tests
- `test/shared/` - Database-agnostic tests
- `test/manual/` - Manual testing scripts for debugging
- `test/sampleData/` - Test schemas and data for both databases

## Important Implementation Notes

- The codebase uses database type detection in `DBManager.js:detectDatabaseType()`
- SQL generation is abstracted through database-specific generators
- Connection pooling is handled per database type
- Schema operations require database-specific managers
- All operations support both callback-style and connection-passing patterns