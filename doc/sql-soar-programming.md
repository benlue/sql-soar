# SQL-SOAR Programming Reference for LLMs

This document provides precise syntax and patterns for programming with SQL-SOAR. Use exact formats shown - do not interpolate or modify syntax.

---

## PREFERRED CODING PATTERN

Use `soar.sql()` expression builder with `soar.execute()` for all CRUD operations. This provides a consistent coding pattern across all database operations.

```javascript
// PREFERRED: Expression builder + execute
const expr = soar.sql('Person')
  .column(['psnID', 'name', 'age'])
  .filter({name: 'psnID'});

soar.execute({query: expr}, {psnID: 1}, callback);
soar.execute({list: expr}, callback);
soar.execute({insert: expr}, {name: 'John', age: 30}, callback);
soar.execute({update: expr}, {age: 31}, {psnID: 1}, callback);
soar.execute({delete: expr}, {psnID: 1}, callback);
```

The shorthand functions (`soar.query()`, `soar.list()`, `soar.insert()`, `soar.update()`, `soar.del()`) are available for simple cases but the expression builder pattern is preferred for consistency.

---

## 1. CONFIGURATION

### Single Database Configuration

```javascript
const soar = require('sql-soar');

soar.config({
  dbConfig: {
    type: 'postgresql',        // REQUIRED: 'mysql' | 'postgresql'
    host: 'localhost',
    port: 5432,                // PostgreSQL: 5432, MySQL: 3306
    database: 'mydb',
    user: 'username',
    password: 'password',
    connectionLimit: 8         // OPTIONAL
  }
});
```

### Multi-Database Configuration

```javascript
soar.config([
  {
    dbConfig: {
      type: 'mysql',
      host: 'localhost',
      database: 'db1',
      user: 'user',
      password: 'pass'
    }
  },
  {
    dbConfig: {
      type: 'postgresql',
      host: 'localhost',
      database: 'db2',
      user: 'user',
      password: 'pass'
    }
  }
]);
```

### Database Type Detection Rules

1. Explicit `type` field takes precedence
2. Port 5432 → PostgreSQL
3. Presence of `ssl` property → PostgreSQL
4. Default → MySQL

---

## 2. CRUD OPERATIONS

### Query (Single Record)

```javascript
// Signature
soar.query(table, query, callback)

// Parameters
// - table: string (table name) OR sqlComp (expression)
// - query: object (filter conditions)
// - callback: function(err, record)

// Example
soar.query('Person', {psnID: 1}, (err, data) => {
  // data = {psnID: 1, name: 'John', age: 30} or null
});
```

### List (Multiple Records)

```javascript
// Signature
soar.list(table, query, callback)

// Parameters
// - table: string OR sqlComp
// - query: object (filter conditions) - OPTIONAL
// - callback: function(err, array)

// Example - all records
soar.list('Person', (err, list) => {
  // list = [{...}, {...}, ...]
});

// Example - filtered
soar.list('Person', {age: 30}, (err, list) => {
  // list = records where age = 30
});
```

### Insert

```javascript
// Signature
soar.insert(table, data, callback)

// Parameters
// - table: string (table name only, not sqlComp)
// - data: object (column-value pairs)
// - callback: function(err, primaryKey)

// Example
soar.insert('Person', {name: 'Jane', age: 25}, (err, pk) => {
  // pk = {psnID: 123} (auto-generated primary key)
});
```

### Update

```javascript
// Signature
soar.update(table, data, query, callback)

// Parameters
// - table: string (table name)
// - data: object (columns to update)
// - query: object (WHERE conditions)
// - callback: function(err)

// Example
soar.update('Person', {age: 31}, {psnID: 1}, (err) => {
  // Record updated
});
```

### Delete

```javascript
// Signature
soar.del(table, query, callback)

// Parameters
// - table: string (table name)
// - query: object (WHERE conditions)
// - callback: function(err)

// Example
soar.del('Person', {psnID: 1}, (err) => {
  // Record deleted
});
```

---

## 3. SQL EXPRESSION BUILDER

### Basic Syntax

```javascript
soar.sql(tableName)
  .column(columns)
  .filter(filter)
  .join(joinSpec)
  .extra(extraClauses)
```

### Table Name Formats

```javascript
soar.sql('Person')                    // Simple
soar.sql('Person AS p')               // With alias (AS keyword)
soar.sql('Person p')                  // With alias (space)
soar.sql('dbname.Person')             // Multi-database routing
```

### Column Specification

```javascript
// Single column
.column('name')

// Multiple columns - array
.column(['psnID', 'name', 'age'])

// With aliases
.column(['p.psnID AS id', 'p.name AS fullName'])

// Chainable - multiple calls append
.column('psnID')
.column('name')
```

### Filter Specification

```javascript
// Simple equality
.filter({name: 'psnID'})
.filter('psnID')                      // String shorthand

// With operator
.filter({name: 'age', op: '>'})
.filter({name: 'age', op: '>='})
.filter({name: 'age', op: '<'})
.filter({name: 'age', op: '<='})
.filter({name: 'age', op: '!='})
.filter({name: 'name', op: 'LIKE'})
.filter({name: 'psnID', op: 'IN'})

// NULL checks
.filter({name: 'addr', op: 'IS NULL'})
.filter({name: 'addr', op: 'IS NOT NULL'})

// Using 'field' property for query parameter mapping
// - name: query parameter name (what you pass in query object)
// - field: actual table column (used in SQL WHERE clause)
.filter([
  {name: 'minAge', field: 'psn.age', op: '>='},
  {name: 'maxAge', field: 'psn.age', op: '<='}
])
// Query with: {minAge: 12, maxAge: 18} → WHERE psn.age >= 12 AND psn.age <= 18

// Note: .filter([...]) is shorthand for .filter({and: [...]})
```

### Join Specification

```javascript
// Basic join (INNER JOIN)
.join({
  table: 'Address AS a',
  on: 'p.addrID = a.addrID'
})

// LEFT JOIN
.join({
  table: 'Address AS a',
  on: 'p.addrID = a.addrID',
  type: 'LEFT'
})

// Multiple joins - chain calls
.join({table: 'Address AS a', on: 'p.addrID = a.addrID'})
.join({table: 'City AS c', on: 'a.cityID = c.cityID', type: 'LEFT'})
```

### Extra Clauses

```javascript
.extra({
  orderBy: 'name ASC',
  groupBy: 'category',
  having: 'COUNT(*) > 5'
})
```

---

## 4. FILTER OPERATORS

### Supported Operators

| Operator | Description | Requires Value |
|----------|-------------|----------------|
| `=` | Equal (default) | Yes |
| `>` | Greater than | Yes |
| `>=` | Greater or equal | Yes |
| `<` | Less than | Yes |
| `<=` | Less or equal | Yes |
| `!=` | Not equal | Yes |
| `<>` | Not equal | Yes |
| `LIKE` | Pattern match | Yes |
| `IN` | Multiple values | Yes (array) |
| `IS NULL` | Null check | No |
| `IS NOT NULL` | Not null check | No |

### Query Object Syntax

When calling query/list/update/del, the query object uses this format:

```javascript
// Simple equality
{fieldName: value}

// Multiple conditions (implicit AND)
{field1: value1, field2: value2}

// Explicit operator
{fieldName: {op: '>', value: 25}}

// OR conditions
{or: {field1: value1, field2: value2}}

// IN operator
{fieldName: [value1, value2, value3]}

// LIKE operator
{fieldName: {op: 'LIKE', value: 'John%'}}
```

### Compound Filters in Expression Builder

Compound filters can be nested to any depth.

```javascript
// AND (explicit)
.filter({
  and: [
    {name: 'age', op: '>='},
    {name: 'status', op: '='}
  ]
})

// AND (shorthand) - array is equivalent to {and: [...]}
.filter([
  {name: 'age', op: '>='},
  {name: 'status', op: '='}
])

// OR
.filter({
  or: [
    {name: 'category'},
    {name: 'type'}
  ]
})

// Nested compound filters (unlimited depth)
.filter({
  or: [
    {name: 'category', op: '='},
    {
      and: [
        {name: 'minPrice', field: 'price', op: '>='},
        {name: 'maxPrice', field: 'price', op: '<='},
        {
          or: [
            {name: 'featured', op: '='},
            {name: 'promoted', op: '='}
          ]
        }
      ]
    }
  ]
})
// Generates: WHERE category = ? OR (price >= ? AND price <= ? AND (featured = ? OR promoted = ?))
```

---

## 5. PAGINATION

### Range Function

```javascript
// Signature
soar.range(pageIndex, pageSize)

// Parameters
// - pageIndex: number (1-based, starts at 1)
// - pageSize: number (default: 20)

// Example
soar.range(1, 10)   // Page 1, 10 items per page
soar.range(2, 25)   // Page 2, 25 items per page
```

### Using Pagination with Execute

```javascript
soar.execute(
  {
    list: soar.sql('Person').column(['psnID', 'name']),
    range: soar.range(1, 10)
  },
  (err, records, totalCount) => {
    // records = array of 10 records
    // totalCount = total matching records (for pagination UI)
  }
);
```

---

## 6. EXECUTE COMMAND

### Command Object Structure

```javascript
{
  op: 'query' | 'list' | 'insert' | 'update' | 'delete',
  expr: sqlCompInstance,
  range: rangeObject,          // OPTIONAL
  conn: connectionObject       // OPTIONAL (for transactions)
}
```

### Short Form Commands

```javascript
{query: expr}                  // Equivalent to {op: 'query', expr: expr}
{list: expr}                   // Equivalent to {op: 'list', expr: expr}
{insert: expr}
{update: expr}
{delete: expr}
```

### Execute Signatures

```javascript
// Query
soar.execute({query: expr}, queryObject, callback(err, record))

// List
soar.execute({list: expr}, callback(err, array))
soar.execute({list: expr}, queryObject, callback(err, array))
soar.execute({list: expr, range: soar.range(1,10)}, callback(err, array, total))

// Insert
soar.execute({insert: expr}, dataObject, callback(err, primaryKey))

// Update
soar.execute({update: expr}, dataObject, queryObject, callback(err))

// Delete
soar.execute({delete: expr}, queryObject, callback(err))
```

---

## 7. RAW SQL EXECUTION

```javascript
// Signature
soar.runSql(sql, params, callback)
soar.runSql(dbName, sql, params, callback)
soar.runSql(connection, sql, params, callback)

// Parameters
// - sql: string (SQL with ? placeholders)
// - params: array (values for placeholders)
// - callback: function(err, result)

// Example
soar.runSql(
  'SELECT * FROM Person WHERE age > ? AND name LIKE ?',
  [25, 'John%'],
  (err, result) => {
    // result = database-specific result object
  }
);
```

---

## 8. CONNECTION MANAGEMENT

### Get Connection

```javascript
// Signature
soar.getConnection(callback)
soar.getConnection(dbName, callback)

// Example
soar.getConnection((err, conn) => {
  // Use conn for operations
  // MUST call conn.release() when done
});
```

### Transaction Pattern

```javascript
soar.getConnection((err, conn) => {
  if (err) return handleError(err);

  conn.beginTransaction((err) => {
    if (err) {
      conn.release();
      return handleError(err);
    }

    soar.insert('Person', {name: 'Test'}, (err, pk) => {
      if (err) {
        conn.rollback(() => conn.release());
        return handleError(err);
      }

      conn.commit((err) => {
        conn.release();
        if (err) return handleError(err);
        // Transaction complete
      });
    });
  });
});
```

---

## 9. SCHEMA OPERATIONS

### Create Table

```javascript
soar.createTable(schema, callback)
soar.createTable(connection, schema, callback)
```

### Schema Object Format

```javascript
{
  title: 'TableName',
  columns: {
    id: {
      type: 'serial'                   // Auto-increment integer
    },
    name: {
      type: 'string',
      maxLength: 100,
      options: {notNull: true}
    },
    age: {
      type: 'integer',
      format: 'int32'
    },
    email: {
      type: 'string',
      maxLength: 255,
      options: {notNull: true}
    },
    created: {
      type: 'datetime',
      options: {default: 'CURRENT_TIMESTAMP'}
    },
    active: {
      type: 'boolean',
      options: {default: true}
    }
  },
  primary: ['id']
}
```

### Column Types

| Type | Formats | Notes |
|------|---------|-------|
| `serial` | - | Auto-increment primary key |
| `integer` | `int16`, `int32`, `int64` | Standard integers |
| `string` | - | Requires `maxLength` |
| `boolean` | - | true/false |
| `datetime` | - | Date and time |
| `float` | - | Floating point |
| `decimal` | - | Fixed precision |

### Column Options

```javascript
options: {
  autoInc: true,                       // Auto increment
  notNull: true,                       // NOT NULL constraint
  default: 'value'                     // Default value
}
```

### Other Schema Operations

```javascript
// Alter table
soar.alterTable(schema, callback)

// Delete table
soar.deleteTable('TableName', callback)

// Describe table
soar.describeTable('TableName', callback)

// Rename table
soar.renameTable('OldName', 'NewName', callback)
```

---

## 10. MULTI-DATABASE ROUTING

When using multi-database configuration, prefix table names with database name:

```javascript
// Routes to specific database
soar.query('db1.Person', {psnID: 1}, callback)
soar.sql('db2.Orders').column(['orderID', 'amount'])

// Without prefix - uses default (first configured) database
soar.query('Person', {psnID: 1}, callback)
```

---

## 11. COMPLETE EXAMPLES

### Example 1: Simple CRUD

```javascript
const soar = require('sql-soar');

soar.config({
  dbConfig: {
    type: 'postgresql',
    host: 'localhost',
    database: 'testdb',
    user: 'user',
    password: 'pass'
  }
});

// Insert
soar.insert('Person', {name: 'John', age: 30}, (err, pk) => {
  const personId = pk.psnID;

  // Query
  soar.query('Person', {psnID: personId}, (err, person) => {
    console.log(person);  // {psnID: 1, name: 'John', age: 30}

    // Update
    soar.update('Person', {age: 31}, {psnID: personId}, (err) => {

      // Delete
      soar.del('Person', {psnID: personId}, (err) => {
        // Done
      });
    });
  });
});
```

### Example 2: Complex Query with Joins

```javascript
const expr = soar.sql('Person AS p')
  .join({table: 'Address AS a', on: 'p.addrID = a.addrID'})
  .join({table: 'City AS c', on: 'a.cityID = c.cityID'})
  .column(['p.psnID', 'p.name', 'a.street', 'c.cityName'])
  .filter({name: 'p.age', op: '>='})
  .filter({name: 'c.country', op: '='});

soar.execute(
  {list: expr, range: soar.range(1, 20)},
  {age: 25, country: 'USA'},
  (err, records, total) => {
    // records = array of matching records
    // total = total count for pagination
  }
);
```

### Example 3: Conditional Filters

```javascript
// Using OR
soar.list('Product', {
  or: {
    category: 'electronics',
    price: {op: '>', value: 1000}
  }
}, (err, products) => {
  // Products in electronics OR price > 1000
});

// Using IN
soar.list('Person', {
  psnID: [1, 2, 3, 4, 5]
}, (err, people) => {
  // People with psnID in array
});

// Using LIKE
soar.list('Person', {
  name: {op: 'LIKE', value: 'John%'}
}, (err, people) => {
  // People whose name starts with 'John'
});
```

### Example 4: Pagination

```javascript
function getPage(pageNum, pageSize, callback) {
  soar.execute(
    {
      list: soar.sql('Product')
        .column(['productID', 'name', 'price'])
        .filter({name: 'active', op: '='}),
      range: soar.range(pageNum, pageSize)
    },
    {active: true},
    (err, records, totalCount) => {
      callback(err, {
        data: records,
        total: totalCount,
        pages: Math.ceil(totalCount / pageSize),
        currentPage: pageNum
      });
    }
  );
}
```

### Example 5: Create Table

```javascript
soar.createTable({
  title: 'Product',
  columns: {
    productID: {type: 'serial'},
    name: {type: 'string', maxLength: 200, options: {notNull: true}},
    price: {type: 'decimal'},
    quantity: {type: 'integer', format: 'int32', options: {default: 0}},
    active: {type: 'boolean', options: {default: true}},
    created: {type: 'datetime', options: {default: 'CURRENT_TIMESTAMP'}}
  },
  primary: ['productID']
}, (err) => {
  if (err) console.error('Table creation failed:', err);
});
```

---

## 12. ERROR HANDLING PATTERN

```javascript
soar.query('Person', {psnID: 1}, (err, data) => {
  if (err) {
    // Handle error
    console.error('Query failed:', err.message);
    return;
  }

  if (!data) {
    // No record found
    console.log('Person not found');
    return;
  }

  // Process data
  console.log('Found:', data);
});
```

---

## 13. KEY RULES

1. **Always specify `type` in dbConfig** - Do not rely on auto-detection
2. **Use callbacks** - All operations are async with Node.js callback pattern
3. **Release connections** - Always call `conn.release()` after `getConnection()`
4. **Primary key return** - `insert()` returns object with primary key(s)
5. **List pagination** - Use `range` option and callback receives 3 params: `(err, array, total)`
6. **Query returns single** - `query()` returns one record or null, not array
7. **Filter in expression vs query object** - Expression `.filter()` defines structure, query object provides values
8. **Multi-DB prefix** - Use `dbname.tablename` format for multi-database routing
9. **String maxLength** - Required for `string` type columns in schema
10. **Page index starts at 1** - Not 0-based

---

## 14. COMMON MISTAKES TO AVOID

```javascript
// WRONG: Missing type in dbConfig
soar.config({dbConfig: {host: 'localhost', database: 'db'}})

// CORRECT: Include type
soar.config({dbConfig: {type: 'postgresql', host: 'localhost', database: 'db'}})

// WRONG: Expecting array from query()
soar.query('Person', {}, (err, records) => {
  records.forEach(...)  // Error - query returns single record
})

// CORRECT: Use list() for multiple records
soar.list('Person', {}, (err, records) => {
  records.forEach(...)
})

// WRONG: Not releasing connection
soar.getConnection((err, conn) => {
  soar.runSql(conn, 'SELECT 1', [], (err, r) => {
    // Missing conn.release()
  })
})

// CORRECT: Always release
soar.getConnection((err, conn) => {
  soar.runSql(conn, 'SELECT 1', [], (err, r) => {
    conn.release();
  })
})

// WRONG: 0-based page index
soar.range(0, 10)  // Returns nothing or error

// CORRECT: 1-based page index
soar.range(1, 10)  // First page
```
