const MySQLSchemaManager = require('../../../lib/mysqlSchemaManager');
const PostgreSQLSchemaManager = require('../../../lib/postgreSchemaManager');

console.log('Comparing MySQL vs PostgreSQL data type mappings...\n');

// Create schema managers
const mysqlManager = new MySQLSchemaManager();
const postgresManager = new PostgreSQLSchemaManager();

// Test cases for comparison
const testCases = [
    // Boolean type
    { type: 'boolean', description: 'Boolean type' },
    
    // Integer types
    { type: 'integer', format: 'int8', description: 'Small integer (8-bit)' },
    { type: 'integer', format: 'int16', description: 'Small integer (16-bit)' },
    { type: 'integer', format: 'int64', description: 'Big integer (64-bit)' },
    { type: 'integer', description: 'Default integer' },
    
    // Number/float types
    { type: 'number', format: 'float', description: 'Single precision float' },
    { type: 'number', format: 'double', description: 'Double precision float' },
    { type: 'number', format: 'decimal(10,2)', description: 'Decimal with precision' },
    { type: 'number', description: 'Default number' },
    
    // String types
    { type: 'string', format: 'text', description: 'Large text' },
    { type: 'string', maxLength: 50, description: 'Variable length string' },
    { type: 'string', description: 'Default string (no length)' },
    
    // Serial types (auto-increment)
    { type: 'serial', description: 'Auto-increment integer' },
    { type: 'serial', format: 'int64', description: 'Auto-increment big integer' }
];

console.log('Data Type Mapping Comparison:\n');
console.log('| sql-soar Type | MySQL Mapping | PostgreSQL Mapping | Notes |');
console.log('|---------------|----------------|---------------------|-------|');

testCases.forEach((testCase) => {
    const prop = {
        type: testCase.type,
        format: testCase.format,
        maxLength: testCase.maxLength
    };
    
    const mysqlType = mysqlManager.toSQLType(prop);
    const postgresType = postgresManager.toSQLType(prop);
    
    const typeDesc = testCase.type + 
        (testCase.format ? `(${testCase.format})` : '') +
        (testCase.maxLength ? `[${testCase.maxLength}]` : '');
    
    // Identify key differences
    let notes = '';
    if (mysqlType !== postgresType) {
        if (testCase.type === 'boolean') {
            notes = 'PostgreSQL has native boolean, MySQL uses tinyint(1)';
        } else if (testCase.type === 'integer' && testCase.format === 'int8') {
            notes = 'PostgreSQL lacks tinyint, uses smallint';
        } else if (testCase.type === 'number' && testCase.format === 'double') {
            notes = 'Different syntax for double precision';
        } else if (testCase.type === 'serial') {
            notes = 'PostgreSQL uses SERIAL, MySQL uses AUTO_INCREMENT';
        } else if (testCase.type === 'string' && !testCase.maxLength) {
            notes = 'Different default string handling';
        }
    } else {
        notes = 'Same mapping';
    }
    
    console.log(`| ${typeDesc.padEnd(13)} | ${mysqlType.padEnd(14)} | ${postgresType.padEnd(19)} | ${notes} |`);
});

console.log('\nKey Differences Summary:');
console.log('1. Boolean: PostgreSQL has native boolean type, MySQL uses tinyint(1)');
console.log('2. TINYINT: PostgreSQL lacks tinyint, maps int8 to smallint');
console.log('3. Double: PostgreSQL uses "double precision", MySQL uses "double"');
console.log('4. Serial: PostgreSQL has native SERIAL types, MySQL uses AUTO_INCREMENT attribute');
console.log('5. Unsigned: PostgreSQL doesn\'t support unsigned integers (not shown in this test)');
console.log('6. String defaults: Different handling for strings without specified length');

console.log('\n✅ Data type mapping comparison completed successfully!');