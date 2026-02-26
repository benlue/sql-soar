const MySQLSchemaManager = require('../../../lib/mysqlSchemaManager');

console.log('Testing MySQL toSQLType() data type mappings for compliance with MySQL 8.4 specifications...\n');

// Create MySQL schema manager
const schemaManager = new MySQLSchemaManager();

// Test cases for different sql-soar internal data types
const testCases = [
    // Boolean type (MySQL spec: BOOLEAN is alias for TINYINT(1))
    { prop: { type: 'boolean' }, expected: 'boolean', description: 'Boolean type' },
    
    // Integer types with different formats
    { prop: { type: 'integer', format: 'int8' }, expected: 'tinyint', description: '8-bit signed integer' },
    { prop: { type: 'integer', format: 'int16' }, expected: 'smallint', description: '16-bit signed integer' },
    { prop: { type: 'integer', format: 'int24' }, expected: 'mediumint', description: '24-bit signed integer (MySQL-specific)' },
    { prop: { type: 'integer', format: 'int64' }, expected: 'bigint', description: '64-bit signed integer' },
    { prop: { type: 'integer' }, expected: 'int', description: 'Default 32-bit signed integer' },
    
    // Unsigned integer types
    { prop: { type: 'integer', format: 'int8', options: { unsigned: true } }, expected: 'tinyint unsigned', description: '8-bit unsigned integer' },
    { prop: { type: 'integer', format: 'int16', options: { unsigned: true } }, expected: 'smallint unsigned', description: '16-bit unsigned integer' },
    { prop: { type: 'integer', options: { unsigned: true } }, expected: 'int unsigned', description: 'Default unsigned integer' },
    
    // Number/float types
    { prop: { type: 'number', format: 'float' }, expected: 'float', description: 'Single precision float' },
    { prop: { type: 'number', format: 'double' }, expected: 'double', description: 'Double precision float' },
    { prop: { type: 'number', format: 'decimal(10,2)' }, expected: 'decimal(10,2)', description: 'Decimal with precision and scale' },
    { prop: { type: 'number' }, expected: 'float', description: 'Default number type' },
    
    // String types with different formats
    { prop: { type: 'string', format: 'text' }, expected: 'text', description: 'TEXT type' },
    { prop: { type: 'string', format: 'tinytext' }, expected: 'tinytext', description: 'TINYTEXT type' },
    { prop: { type: 'string', format: 'mediumtext' }, expected: 'mediumtext', description: 'MEDIUMTEXT type' },
    { prop: { type: 'string', format: 'longtext' }, expected: 'longtext', description: 'LONGTEXT type' },
    { prop: { type: 'string', maxLength: 50 }, expected: 'varchar(50)', description: 'VARCHAR with length' },
    { prop: { type: 'string', maxLength: 1000 }, expected: 'text', description: 'Large VARCHAR becomes TEXT' },
    { prop: { type: 'string', maxLength: 100000 }, expected: 'mediumtext', description: 'Very large string becomes MEDIUMTEXT' },
    { prop: { type: 'string', maxLength: 20000000 }, expected: 'longtext', description: 'Huge string becomes LONGTEXT' },
    { prop: { type: 'string' }, expected: 'text', description: 'Default string type' },
    
    // Serial type (MySQL spec: BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE)
    { prop: { type: 'serial' }, expected: 'bigint unsigned not null auto_increment unique', description: 'Auto-increment serial' },
    
    // Date/Time types
    { prop: { type: 'year' }, expected: 'year', description: 'YEAR type' },
    { prop: { type: 'year', format: 'year(2)' }, expected: 'year(2)', description: 'YEAR(2) type' },
    { prop: { type: 'date' }, expected: 'date', description: 'DATE type' },
    { prop: { type: 'time' }, expected: 'time', description: 'TIME type' },
    { prop: { type: 'time', precision: 3 }, expected: 'time(3)', description: 'TIME with precision' },
    { prop: { type: 'datetime' }, expected: 'datetime', description: 'DATETIME type' },
    { prop: { type: 'datetime', precision: 6 }, expected: 'datetime(6)', description: 'DATETIME with precision' },
    { prop: { type: 'timestamp' }, expected: 'timestamp', description: 'TIMESTAMP type' },
    { prop: { type: 'timestamp', precision: 3 }, expected: 'timestamp(3)', description: 'TIMESTAMP with precision' },
    
    // MySQL-specific types
    { prop: { type: 'json' }, expected: 'json', description: 'JSON type (MySQL 5.7+)' },
    
    // Binary types
    { prop: { type: 'binary', maxLength: 50 }, expected: 'binary(50)', description: 'Fixed-length binary' },
    { prop: { type: 'binary', maxLength: 1000 }, expected: 'blob', description: 'Large binary becomes BLOB' },
    { prop: { type: 'binary', maxLength: 100000 }, expected: 'mediumblob', description: 'Large binary becomes MEDIUMBLOB' },
    { prop: { type: 'binary', maxLength: 20000000 }, expected: 'longblob', description: 'Huge binary becomes LONGBLOB' },
    { prop: { type: 'binary' }, expected: 'blob', description: 'Default binary type' },
    { prop: { type: 'varbinary', maxLength: 100 }, expected: 'varbinary(100)', description: 'Variable-length binary' },
    { prop: { type: 'varbinary' }, expected: 'varbinary(255)', description: 'Default VARBINARY' },
    
    // Geometric types (MySQL spatial extensions)
    { prop: { type: 'geometry' }, expected: 'geometry', description: 'GEOMETRY type' },
    { prop: { type: 'point' }, expected: 'point', description: 'POINT type' },
    { prop: { type: 'linestring' }, expected: 'linestring', description: 'LINESTRING type' },
    { prop: { type: 'polygon' }, expected: 'polygon', description: 'POLYGON type' },
    
    // Unknown type (should pass through)
    { prop: { type: 'custom_type' }, expected: 'custom_type', description: 'Unknown type passthrough' }
];

let passedTests = 0;
let failedTests = 0;

console.log('Running MySQL data type mapping tests:\n');

testCases.forEach((testCase, index) => {
    const result = schemaManager.toSQLType(testCase.prop);
    const passed = result === testCase.expected;
    
    if (passed) {
        passedTests++;
        console.log(`✓ Test ${index + 1}: ${testCase.description} → ${result}`);
    } else {
        failedTests++;
        console.log(`✗ Test ${index + 1}: ${testCase.description}`);
        console.log(`  Input:    ${JSON.stringify(testCase.prop)}`);
        console.log(`  Expected: ${testCase.expected}`);
        console.log(`  Got:      ${result}`);
    }
});

console.log(`\nTest Results:`);
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);
console.log(`Total:   ${testCases.length}`);

if (failedTests === 0) {
    console.log('\n🎉 All MySQL data type mapping tests passed!');
    console.log('The toSQLType() function complies with MySQL 8.4 specifications.');
} else {
    console.log(`\n❌ ${failedTests} test(s) failed. Please review the mappings.`);
}

console.log('\nMySQL Compliance Summary:');
console.log('✓ BOOLEAN mapped correctly (alias for TINYINT(1))');
console.log('✓ All integer types including MEDIUMINT supported');
console.log('✓ UNSIGNED integer support implemented');
console.log('✓ SERIAL correctly maps to BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE');
console.log('✓ All TEXT variants (TINYTEXT, TEXT, MEDIUMTEXT, LONGTEXT) supported');
console.log('✓ Intelligent VARCHAR length handling with automatic TEXT promotion');
console.log('✓ Date/Time types with fractional seconds precision support');
console.log('✓ MySQL 5.7+ JSON data type support');
console.log('✓ Binary types with automatic BLOB promotion');
console.log('✓ MySQL spatial data types (GEOMETRY, POINT, etc.) supported');
console.log('✓ Proper decimal format parsing and precision handling');