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
npm install sql-soar
```

## Quick Start (5 Minutes Guide)

### 1. Database Configuration

#### MySQL Configuration
```javascript
const soar = require('sql-soar');

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
const soar = require('sql-soar');

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

#### Query a Single Record
```javascript
soar.query('Person', {name: "David Lynch"}, function(err, person) {
    if (err) {
        console.log(err.stack);
    } else {
        console.log('Found person:', JSON.stringify(person));
    }
});
```

#### List Multiple Records
```javascript
soar.list('Person', {age: 25}, function(err, people) {
    // Returns all persons with age = 25
    console.log('People aged 25:', people);
});
```

#### Insert Data
```javascript
soar.insert('Person', {name: 'Sean', age: 18}, function(err, result) {
    // result contains the primary key of the inserted record
    console.log('Inserted person with ID:', result);
});
```

#### Update Data
```javascript
soar.update('Person', {weight: 160}, {id: 28}, function(err) {
    // Updates person with id=28, setting weight to 160
});
```

#### Delete Data
```javascript
soar.del('Person', {age: 18}, function(err) {
    // Deletes all persons with age = 18
});
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
const soar = require('sql-soar');

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
soar.query('main_db.users', {active: true}, callback);
soar.list('analytics_db.events', {date: '2024-01-01'}, callback);
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

soar.list('Person', query, function(err, results) {
    // Returns people aged 25+, weighing <= 180lbs, in New York area
});
```

#### Using the IN Clause

```javascript
const expr = soar.sql('Person')
    .filter({name: 'id', op: 'IN'});

const cmd = {list: expr};
const query = {id: [1, 5, 10, 15]};

soar.execute(cmd, query, function(err, people) {
    // Returns people with IDs 1, 5, 10, or 15
});
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

soar.execute(cmd, {}, function(err, people, totalCount) {
    console.log(`Found ${totalCount} total people`);
    console.log(`Showing first 20 people:`, people);
});
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
soar.execute(listCmd, {age: 21}, callback); // List all people 21+
soar.execute(queryCmd, {age: 65}, callback); // Find first person 65+
soar.execute(updateCmd, {status: 'senior'}, {age: 65}, callback); // Update seniors
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

soar.execute({list: expr}, {age: 18}, function(err, results) {
    // Returns people with their address and city information
});
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

soar.execute({list: expr}, {
    age: 65,
    income: 30000,
    has_dependents: true
}, callback);
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
soar.execute(cmd, {
    active: true,
    last_login: '2024-01-01'
}, callback);
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

soar.createTable(schema, function(err) {
    if (!err) {
        console.log('Table created successfully');
    }
});
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

soar.alterTable(alterSchema, callback);
```

#### Describing Tables

```javascript
soar.describeTable('users', function(err, schema) {
    console.log('Table schema:', JSON.stringify(schema, null, 2));
});
```

### Transaction Management

SOAR provides full transaction support for data consistency:

```javascript
const expr = soar.sql('accounts');

soar.getConnection(function(err, conn) {
    if (err) return callback(err);
    
    conn.beginTransaction(function(err) {
        if (err) {
            conn.release();
            return callback(err);
        }
        
        // Debit account A
        const debitCmd = {update: expr, conn: conn};
        soar.execute(debitCmd, 
            {balance: soar.sql().raw('balance - ?', [100])}, 
            {id: accountA}, 
            function(err) {
                if (err) return rollback(conn, callback);
                
                // Credit account B
                const creditCmd = {update: expr, conn: conn};
                soar.execute(creditCmd,
                    {balance: soar.sql().raw('balance + ?', [100])},
                    {id: accountB},
                    function(err) {
                        if (err) return rollback(conn, callback);
                        
                        conn.commit(function(err) {
                            if (err) return rollback(conn, callback);
                            conn.release();
                            callback(null);
                        });
                    }
                );
            }
        );
    });
});

function rollback(conn, callback) {
    conn.rollback(function() {
        conn.release();
        callback(new Error('Transaction failed'));
    });
}
```

### Direct SQL Execution

When you need to execute raw SQL, SOAR provides the `runSql()` function:

```javascript
// With parameters
soar.runSql('SELECT * FROM users WHERE age > ? AND city = ?', 
    [25, 'New York'], 
    function(err, results) {
        console.log('Query results:', results);
    }
);

// Without parameters
soar.runSql('SELECT COUNT(*) as total FROM users', 
    null, 
    function(err, results) {
        console.log('Total users:', results[0].total);
    }
);

// Within a transaction
soar.getConnection(function(err, conn) {
    soar.runSql(conn, 'UPDATE users SET last_seen = NOW()', null, callback);
});
```

### Error Handling and Debugging

#### Debugging SQL Generation

Enable debug mode to see generated SQL statements:

```javascript
const cmd = {
    list: expr,
    debug: true // This will log the generated SQL
};

soar.execute(cmd, query, function(err, results) {
    // Check console for SQL output
});
```

#### Error Handling Best Practices

```javascript
soar.query('users', {id: userId}, function(err, user) {
    if (err) {
        console.error('Database error:', err.message);
        console.error('Stack trace:', err.stack);
        return res.status(500).json({error: 'Database error occurred'});
    }
    
    if (!user) {
        return res.status(404).json({error: 'User not found'});
    }
    
    res.json(user);
});
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
soar.execute({list: expr}, {active: true}, callback);
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

SOAR includes comprehensive test suites for both MySQL and PostgreSQL:

```bash
# Run all tests
npm test

# Run MySQL tests only
npm run test:mysql

# Run PostgreSQL tests only  
npm run test:postgresql

# Run shared tests
npm run test:shared

# Quick test
npm run test:simple
```

### Setting up Test Environment

#### Using Podman/Docker

**PostgreSQL Test Database:**
```bash
npm run start:postgres  # Start PostgreSQL container
npm run setup:postgres  # Initialize schema and sample data
npm run test:postgresql # Run PostgreSQL tests
npm run stop:postgres   # Clean up
```

**MySQL Test Database:**
```bash
npm run start:mysql     # Start MySQL container
npm run setup:mysql     # Initialize schema and sample data
npm run test:mysql      # Run MySQL tests
npm run stop:mysql      # Clean up
```

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `soar.config(options)` | Configure database connections |
| `soar.query(table, conditions, callback)` | Query single record |
| `soar.list(table, conditions, callback)` | Query multiple records |
| `soar.insert(table, data, callback)` | Insert new record |
| `soar.update(table, data, conditions, callback)` | Update existing records |
| `soar.del(table, conditions, callback)` | Delete records |
| `soar.execute(command, data, query, callback)` | Execute SQL expressions |
| `soar.runSql(sql, parameters, callback)` | Execute raw SQL |

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
| `soar.createTable(schema, callback)` | Create database table |
| `soar.alterTable(schema, callback)` | Modify table structure |
| `soar.deleteTable(tableName, callback)` | Drop table |
| `soar.describeTable(tableName, callback)` | Get table schema |

### Utility Functions

| Function | Description |
|----------|-------------|
| `soar.getConnection(callback)` | Get database connection |
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