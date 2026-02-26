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

console.log('Connecting to PostgreSQL database...');

// Test connection and list entries in the Person table
const  listExpr = soar.sql('Person'),
       listCmd = {op: 'list', expr: listExpr, debug: true};

soar.execute(listCmd, function(err, list) {
    if (err) {
        console.error('Error querying Person table:', err);
        process.exit(1);
    } else {
        console.log('Successfully connected to PostgreSQL database!');
        console.log(`Found ${list.length} entries in the Person table:`);
        
        if (list.length > 0) {
            console.log('\nPerson table entries:');
            list.forEach((person, index) => {
                console.log(`${index + 1}:`, JSON.stringify(person, null, 2));
            });
        } else {
            console.log('No entries found in the Person table.');
        }
        
        process.exit(0);
    }
});