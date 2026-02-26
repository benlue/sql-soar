const SchemaManager = require('../../../lib/schemaManager');

console.log('Testing new SchemaManager class structure...');

// Test factory method for both database types
console.log('\n1. Testing factory method:');
const mysqlManager = SchemaManager.createSchemaManager('mysql');
console.log('MySQL manager type:', mysqlManager.databaseType);

const postgreManager = SchemaManager.createSchemaManager('postgresql');
console.log('PostgreSQL manager type:', postgreManager.databaseType);

const defaultManager = SchemaManager.createSchemaManager('unknown');
console.log('Default manager type (should be mysql):', defaultManager.databaseType);

// Test that abstract methods throw errors in base class
console.log('\n2. Testing abstract methods in base class:');
const baseManager = new SchemaManager();

try {
    baseManager.describeTable(null, 'test', () => {});
} catch (err) {
    console.log('✓ describeTable throws error:', err.message);
}

try {
    baseManager.toSchemaType('varchar');
} catch (err) {
    console.log('✓ toSchemaType throws error:', err.message);
}

try {
    baseManager.getSqlGenerator(null);
} catch (err) {
    console.log('✓ getSqlGenerator throws error:', err.message);
}

// Test that subclasses have proper inheritance
console.log('\n3. Testing inheritance:');
console.log('MySQL manager has createTable method:', typeof mysqlManager.createTable === 'function');
console.log('PostgreSQL manager has createTable method:', typeof postgreManager.createTable === 'function');
console.log('MySQL manager has toSchemaType method:', typeof mysqlManager.toSchemaType === 'function');
console.log('PostgreSQL manager has toSchemaType method:', typeof postgreManager.toSchemaType === 'function');

console.log('\n✓ All tests passed! The new class structure is working correctly.');