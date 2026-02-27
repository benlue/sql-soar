# SQL-SOAR

**SOAR** (Simple Object Adapter for Relational database) is a lightweight, flexible Node.js module that bridges the gap between object-oriented programming and relational databases. Unlike traditional ORM solutions that abstract away SQL, SOAR gives developers full control over SQL generation while eliminating the tedious task of hand-coding SQL statements.

## Why SOAR?

Traditional ORMs often force developers into rigid patterns and hide the SQL layer, making it difficult to optimize queries or handle complex database operations. SOAR takes a different approach:

- **SQL Expression System**: Compose reusable SQL queries as JSON objects that can be easily modified and maintained
- **Full SQL Control**: Generate any SQL statement you need while avoiding repetitive hand-coding
- **Multi-Database Support**: Seamlessly work with MySQL and PostgreSQL databases in the same application
- **Schema Management**: Define and manipulate table schemas using intuitive JSON notation
- **Performance Focused**: Lightweight design with efficient query execution and connection pooling

## Key Features

- ✅ **Reusable SQL Expressions**: Build SQL queries once, use them multiple times with different parameters
- ✅ **Simple CRUD Operations**: Intuitive functions for Create, Read, Update, and Delete operations
- ✅ **Advanced Querying**: Support for complex WHERE clauses, JOINs, pagination, and the IN clause
- ✅ **Multi-Database Access**: Easy configuration for multiple MySQL and PostgreSQL databases
- ✅ **Transaction Support**: Full transaction control for data consistency
- ✅ **Schema Management**: Create, alter, and manage database schemas programmatically
- ✅ **Connection Pooling**: Efficient database connection management
- ✅ **File-Based Storage**: Store frequently used SQL expressions as files for better organization

## Installation

```bash
npm install @conwell/sql-soar
```

## Quick Start (5 Minutes Guide)

### 1. Database Configuration

#### MySQL Configuration
```javascript
const soar = require('@conwell/sql-soar');

const options = {
    dbConfig: {
        host: "127.0.0.1",
        database: "soar",
        user: "your_username",
        password: "your_password",
        connectionLimit: 32
    }
};

soar.config(options);
```

#### PostgreSQL Configuration
```javascript
const soar = require('@conwell/sql-soar');

const options = {
    dbConfig: {
        type: "postgresql",
        host: "127.0.0.1",
        port: 5432,
        database: "soar",
        user: "your_username",
        password: "your_password",
        connectionLimit: 32
    }
};

soar.config(options);
```

### 2. Basic Operations

All SOAR operations return Promises and support async/await.

#### Query a Single Record
```javascript
const person = await soar.query('Person', {name: "David Lynch"});
console.log('Found person:', JSON.stringify(person));
```

#### List Multiple Records
```javascript
const people = await soar.list('Person', {age: 25});
// Returns all persons with age = 25
console.log('People aged 25:', people);
```

#### Insert Data
```javascript
const pk = await soar.insert('Person', {name: 'Sean', age: 18});
// pk contains the primary key of the inserted record
console.log('Inserted person with ID:', pk);
```

#### Update Data
```javascript
await soar.update('Person', {weight: 160}, {id: 28});
// Updates person with id=28, setting weight to 160
```

#### Delete Data
```javascript
await soar.del('Person', {age: 18});
// Deletes all persons with age = 18
```

## Comprehensive Usage Guide

### Database Configuration

#### Single Database Setup

You can configure SOAR using a configuration file or programmatically:

**Using config.json file:**
```json
{
    "dbConfig": {
        "type": "mysql",
        "host": "127.0.0.1",
        "database": "soar",
        "user": "username",
        "password": "password",
        "supportBigNumbers": true,
        "connectionLimit": 32
    },
    "storedExpr": "/path/to/stored/expressions"
}
```

**Programmatic configuration:**
```javascript
const soar = require('@conwell/sql-soar');

soar.config({
    dbConfig: {
        type: "postgresql",
        host: "localhost",
        port: 5432,
        database: "myapp",
        user: "dbuser",
        password: "dbpass",
        connectionLimit: 32
    }
});
```

#### Multi-Database Configuration

SOAR excels at managing multiple databases, even mixing MySQL and PostgreSQL:

```javascript
soar.config([
    {
        dbConfig: {
            alias: "main_db",
            type: "mysql",
            host: "mysql-server",
            database: "main_database",
            user: "mysql_user",
            password: "mysql_pass"
        }
    },
    {
        dbConfig: {
            alias: "analytics_db",
            type: "postgresql",
            host: "postgres-server",
            port: 5432,
            database: "analytics",
            user: "postgres_user",
            password: "postgres_pass"
        }
    }
]);

// Query from specific database
const user = await soar.query('main_db.users', {active: true});
const events = await soar.list('analytics_db.events', {date: '2024-01-01'});
```

### Advanced Query Operations

#### Complex Query Conditions

```javascript
// Using operators
const query = {
    age: {op: '>=', value: 25},
    weight: {op: '<=', value: 180},
    city: {op: 'LIKE', value: '%New York%'}
};

const results = await soar.list('Person', query);
// Returns people aged 25+, weighing <= 180lbs, in New York area
```

#### Using the IN Clause

```javascript
const expr = soar.sql('Person')
    .filter({name: 'id', op: 'IN'});

const cmd = {list: expr};
const query = {id: [1, 5, 10, 15]};

const people = await soar.execute(cmd, query);
// Returns people with IDs 1, 5, 10, or 15
```

#### Pagination

```javascript
const expr = soar.sql('Person')
    .column(['id', 'name', 'email'])
    .extra('ORDER BY name');

const cmd = {
    list: expr,
    range: soar.range(1, 20) // Page 1, 20 items per page
};

const result = await soar.execute(cmd);
console.log(`Found ${result.count} total people`);
console.log(`Showing first 20 people:`, result.list);
```

### SQL Expressions - The Power of SOAR

SQL expressions are SOAR's most powerful feature. They allow you to build complex, reusable SQL queries:

#### Basic SQL Expression

```javascript
const expr = soar.sql('Person')
    .column(['id', 'name', 'email'])
    .filter({name: 'age', op: '>='})
    .extra('ORDER BY name');

// Use the expression for different operations
const listCmd = {list: expr};
const queryCmd = {query: expr};
const updateCmd = {update: expr};

// Execute with different parameters
const people = await soar.execute(listCmd, {age: 21});       // List all people 21+
const person = await soar.execute(queryCmd, {age: 65});       // Find first person 65+
await soar.execute(updateCmd, {status: 'senior'}, {age: 65}); // Update seniors
```

#### Table Joins

```javascript
const expr = soar.sql('Person AS p')
    .join({
        table: 'Address AS a',
        on: 'p.address_id = a.id'
    })
    .join({
        table: 'City AS c',
        on: 'a.city_id = c.id'
    })
    .column(['p.name', 'a.street', 'c.name AS city'])
    .filter({name: 'p.age', op: '>='})
    .extra('ORDER BY p.name');

const results = await soar.execute({list: expr}, {age: 18});
// Returns people with their address and city information
```

#### Complex Filtering

```javascript
const expr = soar.sql('Person')
    .filter({
        'or': [
            {name: 'age', op: '>=', value: 65},
            {
                'and': [
                    {name: 'income', op: '<='},
                    {name: 'has_dependents', op: '='}
                ]
            }
        ]
    });

const matches = await soar.execute({list: expr}, {
    age: 65,
    income: 30000,
    has_dependents: true
});
// Finds seniors OR low-income people with dependents
```

#### Stored SQL Expressions

For frequently used queries, store expressions as files:

**queries/active_users.json**
```json
{
    "table": "users",
    "columns": ["id", "username", "email", "last_login"],
    "filter": [
        {"name": "active", "op": "="},
        {"name": "last_login", "op": ">="}
    ],
    "extra": "ORDER BY last_login DESC"
}
```

**Using stored expressions:**
```javascript
// Reference by file path
const cmd = {list: 'queries/active_users'};
const users = await soar.execute(cmd, {
    active: true,
    last_login: '2024-01-01'
});
```

### Schema Management

SOAR provides comprehensive schema management capabilities:

#### Creating Tables

```javascript
const schema = {
    title: 'users',
    columns: {
        id: {type: 'serial', primaryKey: true},
        username: {type: 'varchar', size: 50, notNull: true, unique: true},
        email: {type: 'varchar', size: 255, notNull: true},
        age: {type: 'int'},
        created_at: {type: 'timestamp', default: 'CURRENT_TIMESTAMP'}
    }
};

await soar.createTable(schema);
```

#### Altering Tables

```javascript
const alterSchema = {
    title: 'users',
    add: {
        last_login: {type: 'timestamp'},
        profile_image: {type: 'varchar', size: 255}
    },
    drop: ['old_column'],
    modify: {
        email: {type: 'varchar', size: 320} // Increase email field size
    }
};

await soar.alterTable(alterSchema);
```

#### Describing Tables

```javascript
const schema = await soar.describeTable('users');
console.log('Table schema:', JSON.stringify(schema, null, 2));
```

### Transaction Management

SOAR provides full transaction support for data consistency:

```javascript
const expr = soar.sql('Person')
                 .column(['psnID', 'name'])
                 .filter({name: 'psnID', op: '='});

const conn = await soar.getConnection();
await conn.beginTransaction();

try {
    // Insert a record within the transaction
    const pk = await soar.execute({insert: expr, conn: conn}, {name: 'Scott Cooper'});

    // Delete the record within the same transaction
    await soar.execute({delete: expr, conn: conn}, pk);

    await conn.commit();
} catch (err) {
    await conn.rollback();
    throw err;
} finally {
    conn.release();
}
```

### Direct SQL Execution

When you need to execute raw SQL, SOAR provides the `runSql()` function with three calling forms:

```javascript
// Form 1: runSql(sql, params) — uses default database
const results = await soar.runSql(
    'SELECT * FROM users WHERE age > ?', [25]
);

// Form 2: runSql(dbAlias, sql, params) — targets a specific database
const results = await soar.runSql('analytics_db',
    'SELECT COUNT(*) as total FROM users', null
);

// Form 3: runSql(conn, sql, params) — uses an existing connection (for transactions)
const conn = await soar.getConnection();
await conn.beginTransaction();
try {
    await soar.runSql(conn, 'UPDATE accounts SET balance = balance - ? WHERE id = ?', [100, 1]);
    await soar.runSql(conn, 'UPDATE accounts SET balance = balance + ? WHERE id = ?', [100, 2]);
    await conn.commit();
} catch (err) {
    await conn.rollback();
    throw err;
} finally {
    conn.release();
}
```

### Error Handling and Debugging

#### Debugging SQL Generation

Enable debug mode to see generated SQL statements:

```javascript
const cmd = {
    list: expr,
    debug: true // This will log the generated SQL
};

const results = await soar.execute(cmd, query);
```

#### Error Handling Best Practices

```javascript
try {
    const user = await soar.query('users', {id: userId});
    if (!user) {
        return res.status(404).json({error: 'User not found'});
    }
    res.json(user);
} catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({error: 'Database error occurred'});
}
```

### Performance Optimization

#### Connection Pooling

```javascript
soar.config({
    dbConfig: {
        host: "localhost",
        database: "myapp",
        user: "dbuser",
        password: "dbpass",
        connectionLimit: 50, // Adjust based on your needs
        acquireTimeout: 60000,
        timeout: 60000
    }
});
```

#### Query Optimization

```javascript
// Use specific columns instead of SELECT *
const expr = soar.sql('users')
    .column(['id', 'username', 'email']) // Only select needed columns
    .filter('active')
    .extra('ORDER BY username LIMIT 100'); // Limit results

// Use indexes effectively
const users = await soar.execute({list: expr}, {active: true});
```

## Supported Databases

### MySQL (Default)
- Full support for all MySQL features
- Default database type when no `type` is specified
- Supports MySQL-specific features like `AUTO_INCREMENT`, `ENGINE=InnoDB`

### PostgreSQL
- Full support for PostgreSQL features
- Specify `"type": "postgresql"` in configuration
- Supports PostgreSQL-specific features:
  - `SERIAL` data types for auto-increment
  - Boolean data types
  - PostgreSQL parameter syntax (`$1`, `$2`, etc.)
  - Double-quoted identifiers

### Database Type Detection
SOAR automatically detects the database type based on:
1. **Explicit type**: `"type": "postgresql"` or `"type": "mysql"`
2. **Port detection**: Port 5432 defaults to PostgreSQL
3. **Default fallback**: MySQL for backward compatibility

## Testing

SOAR includes comprehensive test suites for both MySQL and PostgreSQL.

### In-Memory Tests (No External Database Required)

The easiest way to run tests — no Docker, Podman, or database server setup needed:

```bash
# PostgreSQL in-memory tests (uses PGlite — real PostgreSQL in WebAssembly)
npm run test:pg:mem

# MySQL in-memory tests (uses mysql-memory-server — runs a real MySQL binary)
npm run test:mysql:mem
```

**Note:** The first run of `test:mysql:mem` requires a MySQL binary on the system (installed or auto-downloaded by mysql-memory-server).

### External Database Tests

For testing against full database servers (via Podman/Docker):

```bash
# Run all external tests
npm test

# Run MySQL tests only
npm run test:mysql

# Run PostgreSQL tests only
npm run test:postgresql

# Run shared tests
npm run test:shared
```

#### Setting Up External Databases

**PostgreSQL:**
```bash
npm run start:postgres  # Start PostgreSQL container
npm run setup:postgres  # Initialize schema and sample data
npm run test:postgresql # Run PostgreSQL tests
npm run stop:postgres   # Clean up
```

**MySQL:**
```bash
npm run start:mysql     # Start MySQL container
npm run setup:mysql     # Initialize schema and sample data
npm run test:mysql      # Run MySQL tests
npm run stop:mysql      # Clean up
```

## API Reference

### Core Functions

All async functions return Promises.

| Function | Description |
|----------|-------------|
| `soar.config(options)` | Configure database connections |
| `soar.query(table, conditions)` | Query single record |
| `soar.list(table, conditions)` | Query multiple records |
| `soar.insert(table, data)` | Insert new record, returns primary key |
| `soar.update(table, data, conditions)` | Update existing records |
| `soar.del(table, conditions)` | Delete records |
| `soar.execute(command, data, query)` | Execute SQL expressions |
| `soar.runSql(sql, params)` | Execute raw SQL (also accepts `(dbAlias, sql, params)` or `(conn, sql, params)`) |

### SQL Expression Functions

| Function | Description |
|----------|-------------|
| `soar.sql(table)` | Create SQL expression |
| `expr.column(columns)` | Specify columns to select |
| `expr.filter(conditions)` | Add WHERE conditions |
| `expr.join(joinSpec)` | Add table joins |
| `expr.extra(clause)` | Add ORDER BY, GROUP BY, etc. |

### Schema Management Functions

| Function | Description |
|----------|-------------|
| `soar.createTable(schema)` | Create database table |
| `soar.alterTable(schema)` | Modify table structure |
| `soar.deleteTable(tableName)` | Drop table |
| `soar.describeTable(tableName)` | Get table schema |

### Utility Functions

| Function | Description |
|----------|-------------|
| `soar.getConnection()` | Get database connection |
| `soar.range(page, pageSize)` | Create pagination range |

## Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details.

## Support

- **Documentation**: [Full API Documentation](https://github.com/benlue/sql-soar/wiki)
- **Issues**: [GitHub Issues](https://github.com/benlue/sql-soar/issues)
- **Wiki**: [SQL-SOAR Wiki](https://github.com/benlue/sql-soar/wiki)
- **Release Notes**: See [releaseNote.md](./releaseNote.md) for version history

## Related Resources

- [Query Object Documentation](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md)
- [Schema Notation Guide](https://github.com/benlue/sql-soar/blob/master/doc/SchemaNotation.md)
- [PostgreSQL Support Analysis](./doc/PostgreSQL-Support-Analysis.md)
- [PostgreSQL Usage Guide](./doc/PostgreSQL-Guide.md)