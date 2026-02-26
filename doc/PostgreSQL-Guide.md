# PostgreSQL Guide for SQL-SOAR

This guide covers PostgreSQL-specific features and configuration options for SQL-SOAR.

## Quick Start

### Basic PostgreSQL Configuration

```javascript
var soar = require('sql-soar');

soar.config({
    dbConfig: {
        "type": "postgresql",
        "host": "127.0.0.1",
        "port": 5432,
        "database": "your_database",
        "user": "your_username", 
        "password": "your_password",
        "connectionLimit": 32
    }
});
```

### Multiple Database Configuration (MySQL + PostgreSQL)

```javascript
soar.config([
    {
        dbConfig: {
            "alias": "mysql_db",
            "type": "mysql",
            "host": "127.0.0.1",
            "database": "mysql_database",
            "user": "mysql_user",
            "password": "mysql_password"
        }
    },
    {
        dbConfig: {
            "alias": "postgres_db", 
            "type": "postgresql",
            "host": "127.0.0.1",
            "port": 5432,
            "database": "postgres_database",
            "user": "postgres_user",
            "password": "postgres_password"
        }
    }
]);
```

## PostgreSQL-Specific Features

### Data Types

PostgreSQL supports additional data types that are automatically handled:

```javascript
// Schema definition
var schema = {
    title: 'UserAccount',
    columns: {
        id: {type: 'integer', format: 'int64', options: {autoInc: true}}, // Becomes SERIAL
        email: {type: 'string', maxLength: 255, options: {notNull: true}}, // VARCHAR(255)
        active: {type: 'boolean', options: {default: true}}, // BOOLEAN
        created: {type: 'datetime', options: {default: 'CURRENT_TIMESTAMP'}}, // TIMESTAMP
        settings: {type: 'jsonb'} // PostgreSQL JSONB type (if supported)
    },
    primary: ['id']
};

soar.createTable(schema, callback);
```

### Auto-Increment Fields

PostgreSQL uses `SERIAL` instead of MySQL's `AUTO_INCREMENT`:

```javascript
// This schema definition:
{
    id: {type: 'integer', format: 'int64', options: {autoInc: true}}
}

// Generates PostgreSQL SQL:
// "id" SERIAL PRIMARY KEY

// vs MySQL SQL:
// `id` BIGINT AUTO_INCREMENT PRIMARY KEY
```

### Boolean Data Type

PostgreSQL has native boolean support:

```javascript
// Schema
{
    active: {type: 'boolean', options: {default: true}}
}

// PostgreSQL: "active" BOOLEAN DEFAULT TRUE
// MySQL: `active` TINYINT(1) DEFAULT 1
```

### Identifiers and Quoting

PostgreSQL uses double quotes for identifiers:

```javascript
// Generated SQL in PostgreSQL:
SELECT "name", "age" FROM "Person" WHERE "id" = $1

// Generated SQL in MySQL:
SELECT `name`, `age` FROM `Person` WHERE `id` = ?
```

### Parameter Placeholders

PostgreSQL uses numbered parameters (`$1`, `$2`, etc.) instead of MySQL's `?`:

```javascript
// Same SOAR code:
soar.query('Person', {name: 'John', age: 30}, callback);

// PostgreSQL: SELECT * FROM "Person" WHERE "name" = $1 AND "age" = $2
// MySQL: SELECT * FROM `Person` WHERE `name` = ? AND `age` = ?
```

## Configuration Options

### Required PostgreSQL Options

| Option | Description | Example |
|--------|-------------|---------|
| `type` | Database type (required for PostgreSQL) | `"postgresql"` |
| `host` | Database host | `"127.0.0.1"` |
| `port` | Database port (default: 5432) | `5432` |
| `database` | Database name | `"myapp_db"` |
| `user` | Database username | `"postgres"` |
| `password` | Database password | `"mypassword"` |

### Optional PostgreSQL Options

| Option | Description | Default |
|--------|-------------|---------|
| `connectionLimit` | Max connections in pool (mapped to `max`) | `10` |
| `minConnection` | Min connections in pool (mapped to `min`) | `0` |
| `ssl` | SSL configuration object | `false` |
| `alias` | Database alias for multi-DB | Database name |

### PostgreSQL Pool Configuration

For backward compatibility, SOAR maps MySQL-style options to PostgreSQL equivalents:

| MySQL/SOAR Option | PostgreSQL Option | Description |
|-------------------|-------------------|-------------|
| `connectionLimit` | `max` | Maximum number of connections in pool |
| `minConnection` | `min` | Minimum number of connections in pool |

You can also use native PostgreSQL pool options directly:

```javascript
{
    dbConfig: {
        "type": "postgresql",
        "host": "127.0.0.1",
        "database": "mydb",
        "user": "user",
        "password": "pass",
        // SOAR-style options (recommended for consistency)
        "connectionLimit": 20,        // Max connections (mapped to max)
        "minConnection": 2,           // Min connections (mapped to min)
        // Or native PostgreSQL pool options
        "max": 20,                    // Max connections (default: 10)
        "min": 2,                     // Min connections (default: 0)  
        "idleTimeoutMillis": 30000,   // Close idle connections after 30s
        "connectionTimeoutMillis": 2000 // Timeout when acquiring connection
    }
}

### SSL Configuration

```javascript
{
    dbConfig: {
        "type": "postgresql",
        "host": "postgres.example.com",
        "database": "secure_db", 
        "user": "app_user",
        "password": "app_password",
        "ssl": {
            "rejectUnauthorized": false
        }
    }
}
```

### Certificate Authentication (Recommended for Production)

For enhanced security, PostgreSQL supports certificate-based authentication which eliminates the need for passwords:

```javascript
{
    dbConfig: {
        "type": "postgresql",
        "host": "postgres.example.com",
        "database": "secure_db",
        "user": "app_user",  // Must match certificate's Common Name (CN)
        "ssl": {
            "rejectUnauthorized": true,
            "ca": "path/to/ca-cert.pem",       // Certificate Authority file path
            "cert": "path/to/client-cert.pem", // Client certificate file path
            "key": "path/to/client-key.pem"    // Client private key file path
        }
    }
}
```

**Note**: SOAR automatically reads the certificate files from the specified paths. You can use either:
- **File paths** (recommended): `"ca": "path/to/ca-cert.pem"`
- **Certificate content**: `"ca": fs.readFileSync('ca-cert.pem', 'utf8')` (if you need to read files manually)

### Certificate Generation Example

To set up certificate authentication, you need to generate the required certificate files:

```bash
# 1. Create Certificate Authority (CA)
openssl genrsa -out ca-key.pem 4096
openssl req -new -x509 -key ca-key.pem -out ca-cert.pem -days 365 \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=PostgreSQL-CA"

# 2. Create client certificate for 'app_user'
openssl genrsa -out client-key.pem 4096
openssl req -new -key client-key.pem -out client.csr \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=app_user"
openssl x509 -req -in client.csr -CA ca-cert.pem -CAkey ca-key.pem \
    -out client-cert.pem -days 365 -CAcreateserial

# 3. Create server certificate (for PostgreSQL server)
openssl genrsa -out server-key.pem 4096
openssl req -new -key server-key.pem -out server.csr \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=postgres.example.com"
openssl x509 -req -in server.csr -CA ca-cert.pem -CAkey ca-key.pem \
    -out server-cert.pem -days 365 -CAcreateserial

# 4. Clean up certificate signing request files
rm client.csr server.csr
```

**Certificate Files Explained:**
- `ca-cert.pem` - Certificate Authority public certificate (identifies trusted CA)
- `client-cert.pem` - Client certificate (identifies the user/application)
- `client-key.pem` - Client private key (proves ownership of client certificate)
- `server-cert.pem` - Server certificate (identifies PostgreSQL server)
- `server-key.pem` - Server private key (used by PostgreSQL server)

**PostgreSQL Server Configuration (`pg_hba.conf`):**
```
# Allow certificate authentication for app_user
hostssl  secure_db  app_user  0.0.0.0/0  cert
```

**Benefits of Certificate Authentication:**
- No passwords transmitted over network
- Automatic expiration and revocation capabilities
- Stronger cryptographic security
- Mutual authentication (both client and server verified)

## Database Type Detection

SOAR automatically detects PostgreSQL in these cases:

1. **Explicit type**: `"type": "postgresql"`
2. **Port detection**: `"port": 5432` (PostgreSQL default)
3. **SSL presence**: SSL configuration suggests PostgreSQL

Without explicit configuration, SOAR defaults to MySQL for backward compatibility.

## Multi-Database Operations

When using multiple databases, specify the database in table names:

```javascript
// Query MySQL database
var mysqlExpr = soar.sql('mysql_db.users')
    .column(['id', 'name'])
    .filter({status: 'active'});

// Query PostgreSQL database  
var pgExpr = soar.sql('postgres_db.users')
    .column(['id', 'name'])
    .filter({status: 'active'});
```

## Schema Operations

### Creating Tables

```javascript
var schema = {
    title: 'products',
    columns: {
        id: {type: 'integer', format: 'int64', options: {autoInc: true}},
        name: {type: 'string', maxLength: 100, options: {notNull: true}},
        price: {type: 'number', format: 'decimal(10,2)'},
        in_stock: {type: 'boolean', options: {default: true}},
        created_at: {type: 'datetime', options: {default: 'CURRENT_TIMESTAMP'}}
    },
    primary: ['id'],
    options: {
        comment: 'Product catalog table'
    }
};

soar.createTable(schema, function(err, result) {
    if (err) console.error('Error:', err);
    else console.log('Table created successfully');
});
```

### Generated PostgreSQL SQL:
```sql
CREATE TABLE "products"
(
  "id"         SERIAL,
  "name"       VARCHAR(100) NOT NULL,
  "price"      DECIMAL(10,2),
  "in_stock"   BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
COMMENT ON TABLE "products" IS 'Product catalog table';
```

## Migration from MySQL

### Common Differences

| Feature | MySQL | PostgreSQL |
|---------|-------|------------|
| Auto Increment | `AUTO_INCREMENT` | `SERIAL` |
| Boolean | `TINYINT(1)` | `BOOLEAN` |
| Quotes | Backticks `` ` `` | Double quotes `"` |
| Parameters | `?` | `$1, $2, $3` |
| Pagination | `LIMIT offset, count` | `LIMIT count OFFSET offset` |
| Row Count | `FOUND_ROWS()` | `COUNT(*) OVER()` |

### Migration Steps

1. **Update Configuration**: Add `"type": "postgresql"` to your database config
2. **Review Data Types**: Check for MySQL-specific types that need mapping
3. **Test Schema Operations**: Verify CREATE/ALTER table operations work
4. **Update Connection Strings**: Change host/port/credentials as needed
5. **Run Tests**: Verify all CRUD operations work correctly

## Error Handling

Common PostgreSQL-specific errors and solutions:

### Connection Errors
```javascript
// Error: Connection refused
// Solution: Check if PostgreSQL is running and accessible
{
    "host": "127.0.0.1",
    "port": 5432  // Default PostgreSQL port
}
```

### Authentication Errors
```javascript
// Error: authentication failed
// Solution: Verify username/password and PostgreSQL auth settings
{
    "user": "correct_username",
    "password": "correct_password"
}
```

### Schema Errors
```javascript
// Error: relation does not exist
// Solution: Ensure table exists and case-sensitivity is handled
soar.createTable(schema, callback); // Create table first
```

## Performance Tips

1. **Connection Pooling**: Use appropriate `connectionLimit` for your load
2. **Prepared Statements**: SOAR automatically uses prepared statements
3. **Indexes**: Create indexes on frequently queried columns
4. **Data Types**: Use appropriate PostgreSQL data types for better performance

## Examples

### Complete CRUD Example

```javascript
var soar = require('sql-soar');

// Configure PostgreSQL
soar.config({
    dbConfig: {
        "type": "postgresql",
        "host": "localhost",
        "database": "testdb",
        "user": "postgres",
        "password": "password"
    }
});

// Create
soar.insert('users', {
    name: 'John Doe',
    email: 'john@example.com',
    active: true
}, function(err, result) {
    console.log('Created user:', result);
});

// Read
soar.query('users', {email: 'john@example.com'}, function(err, user) {
    console.log('Found user:', user);
});

// Update
soar.update('users', {active: false}, {email: 'john@example.com'}, function(err) {
    console.log('Updated user');
});

// Delete
soar.del('users', {email: 'john@example.com'}, function(err) {
    console.log('Deleted user');
});
```

For more examples, see the test files in `test/testPostgreSQL.js` and `test/testMultiDBPostgreSQL.js`.