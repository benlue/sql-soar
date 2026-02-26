const SchemaManager = require('../../../lib/schemaManager');
const soar = require('../../../lib/soar');

// Database configuration for PostgreSQL
const DB_HOST = '192.168.100.77' || 'localhost';

const options = {
    dbConfig: {
        "type": "postgresql",
        "host": DB_HOST,
        "port": 5432,
        "database": "soar",
        "user": "soaruser",
        "password": "1234soar",
        "connectionLimit": 8
    }
};

// Configure SOAR with PostgreSQL settings
soar.config(options);

console.log('Testing new SchemaManager class structure with PostgreSQL...');

// Create PostgreSQL schema manager using factory method
const schemaManager = SchemaManager.createSchemaManager('postgresql');
console.log('Created PostgreSQL schema manager:', schemaManager.databaseType);

// Get a database connection and test describeTable
soar.getConnection(function(err, conn) {
    if (err) {
        console.error('Error getting database connection:', err);
        process.exit(1);
    }

    console.log('Got database connection, describing Person table...');
    
    // Test the describeTable function with new class structure
    schemaManager.describeTable(conn, 'Person', function(err, schema) {
        // Release the connection
        conn.release();
        
        if (err) {
            console.error('Error describing table:', err);
            process.exit(1);
        } else {
            console.log('Successfully described Person table using new class structure!');
            console.log('Table schema:');
            console.log(JSON.stringify(schema, null, 2));
            process.exit(0);
        }
    });
});