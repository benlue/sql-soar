# SQL-SOAR Testing Guide

This directory contains tests for both MySQL and PostgreSQL database support.

## Test Structure

### Test Files
- `testPostgreSQL.js` - PostgreSQL-specific functionality tests
- `testMultiDBPostgreSQL.js` - Multi-database tests (MySQL + PostgreSQL)
- `testConfig.js`, `testQuery.js`, etc. - Existing MySQL tests

### Sample Data
- `sampleData/schema.sql` - MySQL schema
- `sampleData/sampleData.sql` - MySQL test data
- `sampleData/schemaPostgreSQL.sql` - PostgreSQL schema
- `sampleData/sampleDataPostgreSQL.sql` - PostgreSQL test data

## Running Tests

### Prerequisites
You need either:
1. **Local databases** - MySQL and/or PostgreSQL installed locally
2. **Docker** - Use provided Docker Compose setup

### Option 1: Using Docker (Recommended)

1. **Start test databases:**
   ```bash
   cd test
   docker-compose -f docker-compose.test.yml up -d
   ```

2. **Wait for databases to be ready:**
   ```bash
   # Check health status
   docker-compose -f docker-compose.test.yml ps
   ```

3. **Run tests:**
   ```bash
   # All tests
   npm test
   
   # PostgreSQL only
   npm run test:postgresql
   
   # Multi-database tests
   npm run test:multidb
   ```

4. **Stop test databases:**
   ```bash
   docker-compose -f docker-compose.test.yml down
   ```

### Option 2: Local Databases

1. **Setup MySQL:**
   - Create database: `soar`
   - User: `your_acc` / Password: `your_passwd`
   - Run: `mysql -u your_acc -p soar < sampleData/schema.sql`
   - Run: `mysql -u your_acc -p soar < sampleData/sampleData.sql`

2. **Setup PostgreSQL:**
   - Create database: `soar_test`
   - User: `postgres` / Password: `password`
   - Run: `psql -U postgres -d soar_test -f sampleData/schemaPostgreSQL.sql`
   - Run: `psql -U postgres -d soar_test -f sampleData/sampleDataPostgreSQL.sql`

3. **Run tests:**
   ```bash
   npm test
   ```

## Test Categories

### Basic PostgreSQL Tests (`testPostgreSQL.js`)
- CRUD operations (Create, Read, Update, Delete)
- Schema operations (CREATE/DROP tables)
- PostgreSQL-specific features (boolean types, etc.)

### Multi-Database Tests (`testMultiDBPostgreSQL.js`)
- Cross-database operations
- SQL generation comparison
- Connection management

### Error Handling
Tests gracefully handle missing databases by:
- Logging informational messages
- Skipping tests when database unavailable
- Not failing the entire test suite

## Database Configuration

### MySQL Configuration
```javascript
{
  "dbConfig": {
    "type": "mysql",  // Optional, auto-detected
    "host": "127.0.0.1",
    "database": "soar",
    "user": "your_acc",
    "password": "your_passwd"
  }
}
```

### PostgreSQL Configuration
```javascript
{
  "dbConfig": {
    "type": "postgresql",  // Explicit type
    "host": "127.0.0.1",
    "port": 5432,
    "database": "soar_test",
    "user": "postgres",
    "password": "password"
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure database is running
   - Check host/port configuration
   - Verify credentials

2. **Table Does Not Exist**
   - Run schema creation scripts
   - Check database name

3. **Permission Denied**
   - Verify user has CREATE/DROP permissions
   - Check password

### Debug Mode
Set `DEBUG=true` environment variable for detailed SQL logging:
```bash
DEBUG=true npm test
```

## Admin Tools (Optional)

With Docker Compose, you can also start admin tools:

```bash
# Start with admin tools
docker-compose -f docker-compose.test.yml --profile admin up -d

# Access tools:
# phpMyAdmin: http://localhost:8081
# pgAdmin: http://localhost:8080
```