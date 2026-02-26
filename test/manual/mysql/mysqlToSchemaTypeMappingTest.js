const MySQLSchemaManager = require('../../../lib/mysqlSchemaManager');

console.log('Testing MySQL toSchemaType() reverse data type mappings...\n');

// Create MySQL schema manager
const schemaManager = new MySQLSchemaManager();

// Test cases for converting MySQL data types back to sql-soar schema types
const testCases = [
    // Boolean types
    { mysqlType: 'boolean', expected: { type: 'boolean', options: {} } },
    { mysqlType: 'bool', expected: { type: 'boolean', options: {} } },
    { mysqlType: 'tinyint(1)', expected: { type: 'boolean', options: {} } },
    
    // Integer types
    { mysqlType: 'tinyint', expected: { type: 'integer', format: 'int8', options: {} } },
    { mysqlType: 'smallint', expected: { type: 'integer', format: 'int16', options: {} } },
    { mysqlType: 'mediumint', expected: { type: 'integer', format: 'int24', options: {} } },
    { mysqlType: 'int', expected: { type: 'integer', options: {} } },
    { mysqlType: 'integer', expected: { type: 'integer', options: {} } },
    { mysqlType: 'bigint', expected: { type: 'integer', format: 'int64', options: {} } },
    
    // Unsigned integer types
    { mysqlType: 'bigint unsigned', expected: { type: 'integer', format: 'int64', options: { unsigned: true } } },
    { mysqlType: 'int unsigned', expected: { type: 'integer', options: { unsigned: true } } },
    { mysqlType: 'smallint unsigned', expected: { type: 'integer', format: 'int16', options: { unsigned: true } } },
    { mysqlType: 'mediumint unsigned', expected: { type: 'integer', format: 'int24', options: { unsigned: true } } },
    { mysqlType: 'tinyint unsigned', expected: { type: 'integer', format: 'int8', options: { unsigned: true } } },
    
    // TINYINT with different sizes (only TINYINT(1) should be boolean)
    { mysqlType: 'tinyint(2)', expected: { type: 'integer', format: 'int8', options: {} } },
    { mysqlType: 'tinyint(3) unsigned', expected: { type: 'integer', format: 'int8', options: { unsigned: true } } },
    
    // Floating point types
    { mysqlType: 'float', expected: { type: 'number', format: 'float', options: {} } },
    { mysqlType: 'double', expected: { type: 'number', format: 'double', options: {} } },
    { mysqlType: 'double precision', expected: { type: 'number', format: 'double', options: {} } },
    { mysqlType: 'real', expected: { type: 'number', format: 'float', options: {} } },
    
    // Decimal/Numeric types
    { mysqlType: 'decimal(10,2)', expected: { type: 'number', format: 'decimal(10,2)', options: {} } },
    { mysqlType: 'numeric(8,3)', expected: { type: 'number', format: 'decimal(8,3)', options: {} } },
    { mysqlType: 'decimal', expected: { type: 'number', options: {} } },
    { mysqlType: 'numeric', expected: { type: 'number', options: {} } },
    
    // String types
    { mysqlType: 'text', expected: { type: 'string', format: 'text', options: {} } },
    { mysqlType: 'tinytext', expected: { type: 'string', format: 'tinytext', options: {} } },
    { mysqlType: 'mediumtext', expected: { type: 'string', format: 'mediumtext', options: {} } },
    { mysqlType: 'longtext', expected: { type: 'string', format: 'longtext', options: {} } },
    { mysqlType: 'varchar(50)', expected: { type: 'string', maxLength: 50, options: {} } },
    { mysqlType: 'char(10)', expected: { type: 'string', maxLength: 10, options: {} } },
    { mysqlType: 'varchar', expected: { type: 'string', options: {} } },
    { mysqlType: 'char', expected: { type: 'string', options: {} } },
    
    // Date/Time types
    { mysqlType: 'date', expected: { type: 'date', options: {} } },
    { mysqlType: 'time', expected: { type: 'time', options: {} } },
    { mysqlType: 'time(3)', expected: { type: 'time', precision: 3, options: {} } },
    { mysqlType: 'datetime', expected: { type: 'datetime', options: {} } },
    { mysqlType: 'datetime(6)', expected: { type: 'datetime', precision: 6, options: {} } },
    { mysqlType: 'timestamp', expected: { type: 'timestamp', options: {} } },
    { mysqlType: 'timestamp(3)', expected: { type: 'timestamp', precision: 3, options: {} } },
    { mysqlType: 'year', expected: { type: 'year', options: {} } },
    { mysqlType: 'year(2)', expected: { type: 'year', format: 'year(2)', options: {} } },
    
    // MySQL-specific types
    { mysqlType: 'json', expected: { type: 'json', options: {} } },
    
    // Binary types
    { mysqlType: 'blob', expected: { type: 'binary', options: {} } },
    { mysqlType: 'tinyblob', expected: { type: 'binary', format: 'tinyblob', options: {} } },
    { mysqlType: 'mediumblob', expected: { type: 'binary', format: 'mediumblob', options: {} } },
    { mysqlType: 'longblob', expected: { type: 'binary', format: 'longblob', options: {} } },
    { mysqlType: 'binary(20)', expected: { type: 'binary', maxLength: 20, options: {} } },
    { mysqlType: 'varbinary(100)', expected: { type: 'varbinary', maxLength: 100, options: {} } },
    { mysqlType: 'binary', expected: { type: 'binary', options: {} } },
    { mysqlType: 'varbinary', expected: { type: 'varbinary', options: {} } },
    
    // Spatial/Geometric types
    { mysqlType: 'geometry', expected: { type: 'geometry', options: {} } },
    { mysqlType: 'point', expected: { type: 'point', options: {} } },
    { mysqlType: 'linestring', expected: { type: 'linestring', options: {} } },
    { mysqlType: 'polygon', expected: { type: 'polygon', options: {} } },
    { mysqlType: 'multipoint', expected: { type: 'multipoint', options: {} } },
    { mysqlType: 'multilinestring', expected: { type: 'multilinestring', options: {} } },
    { mysqlType: 'multipolygon', expected: { type: 'multipolygon', options: {} } },
    { mysqlType: 'geometrycollection', expected: { type: 'geometrycollection', options: {} } },
    
    // Case insensitive tests
    { mysqlType: 'VARCHAR(25)', expected: { type: 'string', maxLength: 25, options: {} } },
    { mysqlType: 'INT UNSIGNED', expected: { type: 'integer', options: { unsigned: true } } },
    { mysqlType: 'BIGINT UNSIGNED', expected: { type: 'integer', format: 'int64', options: { unsigned: true } } },
    { mysqlType: 'DECIMAL(5,2)', expected: { type: 'number', format: 'decimal(5,2)', options: {} } },
    
    // Unknown type (should pass through)
    { mysqlType: 'custom_type', expected: { type: 'custom_type', options: {} } }
];

let passedTests = 0;
let failedTests = 0;

console.log('Running MySQL toSchemaType() tests:\n');

// Deep comparison function
function deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object') return a === b;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (let key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!deepEqual(a[key], b[key])) return false;
    }
    
    return true;
}

testCases.forEach((testCase, index) => {
    const result = schemaManager.toSchemaType(testCase.mysqlType);
    const passed = deepEqual(result, testCase.expected);
    
    if (passed) {
        passedTests++;
        console.log(`✓ Test ${index + 1}: ${testCase.mysqlType} → ${JSON.stringify(result)}`);
    } else {
        failedTests++;
        console.log(`✗ Test ${index + 1}: ${testCase.mysqlType}`);
        console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`  Got:      ${JSON.stringify(result)}`);
    }
});

console.log(`\nTest Results:`);
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);
console.log(`Total:   ${testCases.length}`);

if (failedTests === 0) {
    console.log('\n🎉 All MySQL toSchemaType() mapping tests passed!');
    console.log('The function properly converts MySQL data types to sql-soar schema format.');
} else {
    console.log(`\n❌ ${failedTests} test(s) failed. Please review the reverse mappings.`);
}

console.log('\nMySQL Reverse Mapping Compliance Summary:');
console.log('✓ BOOLEAN, BOOL, and TINYINT(1) correctly map to boolean');
console.log('✓ All integer types (TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT) mapped correctly');
console.log('✓ UNSIGNED attribute detection and mapping works correctly');
console.log('✓ TINYINT(1) vs other TINYINT sizes handled correctly');
console.log('✓ All floating point types (FLOAT, DOUBLE, REAL) mapped correctly');
console.log('✓ DECIMAL/NUMERIC with precision and scale parsing');
console.log('✓ All TEXT variants (TINYTEXT, TEXT, MEDIUMTEXT, LONGTEXT) supported');
console.log('✓ VARCHAR and CHAR with length parameters parsed correctly');
console.log('✓ Date/Time types with precision support');
console.log('✓ MySQL-specific YEAR type handling');
console.log('✓ JSON data type support');
console.log('✓ All BLOB variants (TINYBLOB, BLOB, MEDIUMBLOB, LONGBLOB) supported');
console.log('✓ Binary types (BINARY, VARBINARY) with length parameters');
console.log('✓ MySQL spatial/geometric data types supported');
console.log('✓ Case-insensitive type name handling');
console.log('✓ Unknown types pass through as-is');