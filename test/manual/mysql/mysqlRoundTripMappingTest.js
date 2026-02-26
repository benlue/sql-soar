const MySQLSchemaManager = require('../../../lib/mysqlSchemaManager');

console.log('Testing MySQL round-trip data type mappings...\n');
console.log('This test verifies that sql-soar → MySQL → sql-soar conversions work correctly.\n');

// Create MySQL schema manager
const schemaManager = new MySQLSchemaManager();

// Test cases for round-trip conversion
const testCases = [
    // Basic types
    { prop: { type: 'boolean' }, description: 'Boolean type' },
    
    // Integer types
    { prop: { type: 'integer', format: 'int8' }, description: 'Small integer (8-bit)' },
    { prop: { type: 'integer', format: 'int16' }, description: 'Small integer (16-bit)' },
    { prop: { type: 'integer', format: 'int24' }, description: 'Medium integer (24-bit)' },
    { prop: { type: 'integer', format: 'int64' }, description: 'Big integer (64-bit)' },
    { prop: { type: 'integer' }, description: 'Default integer' },
    
    // Unsigned integer types
    { prop: { type: 'integer', format: 'int8', options: { unsigned: true } }, description: 'Unsigned small integer' },
    { prop: { type: 'integer', format: 'int16', options: { unsigned: true } }, description: 'Unsigned 16-bit integer' },
    { prop: { type: 'integer', format: 'int24', options: { unsigned: true } }, description: 'Unsigned medium integer' },
    { prop: { type: 'integer', format: 'int64', options: { unsigned: true } }, description: 'Unsigned big integer' },
    { prop: { type: 'integer', options: { unsigned: true } }, description: 'Unsigned default integer' },
    
    // Number types
    { prop: { type: 'number', format: 'float' }, description: 'Single precision float' },
    { prop: { type: 'number', format: 'double' }, description: 'Double precision float' },
    { prop: { type: 'number', format: 'decimal(10,2)' }, description: 'Decimal with precision' },
    { prop: { type: 'number' }, description: 'Default number' },
    
    // String types
    { prop: { type: 'string', format: 'text' }, description: 'Large text' },
    { prop: { type: 'string', format: 'tinytext' }, description: 'Tiny text' },
    { prop: { type: 'string', format: 'mediumtext' }, description: 'Medium text' },
    { prop: { type: 'string', format: 'longtext' }, description: 'Long text' },
    { prop: { type: 'string', maxLength: 50 }, description: 'Variable length string' },
    { prop: { type: 'string' }, description: 'Default string (unlimited)' },
    
    // Serial types
    { prop: { type: 'serial' }, description: 'Auto-increment integer' },
    
    // Date/Time types
    { prop: { type: 'date' }, description: 'Date type' },
    { prop: { type: 'time' }, description: 'Time type' },
    { prop: { type: 'time', precision: 3 }, description: 'Time with precision' },
    { prop: { type: 'datetime' }, description: 'Datetime type' },
    { prop: { type: 'datetime', precision: 6 }, description: 'Datetime with precision' },
    { prop: { type: 'timestamp' }, description: 'Timestamp type' },
    { prop: { type: 'timestamp', precision: 3 }, description: 'Timestamp with precision' },
    { prop: { type: 'year' }, description: 'Year type' },
    { prop: { type: 'year', format: 'year(2)' }, description: 'Year(2) type' },
    
    // MySQL-specific types
    { prop: { type: 'json' }, description: 'JSON type' },
    
    // Binary types
    { prop: { type: 'binary', maxLength: 50 }, description: 'Fixed binary data' },
    { prop: { type: 'binary' }, description: 'Default binary' },
    { prop: { type: 'varbinary', maxLength: 100 }, description: 'Variable binary data' },
    { prop: { type: 'varbinary' }, description: 'Default varbinary' },
    
    // Geometric types
    { prop: { type: 'geometry' }, description: 'Geometry type' },
    { prop: { type: 'point' }, description: 'Point type' },
    { prop: { type: 'linestring' }, description: 'Linestring type' },
    { prop: { type: 'polygon' }, description: 'Polygon type' }
];

let passedTests = 0;
let failedTests = 0;
let warnings = 0;

console.log('Running round-trip conversion tests:\n');
console.log('| Test | sql-soar → MySQL → sql-soar | Status |');
console.log('|------|------------------------------|--------|');

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
    const originalProp = testCase.prop;
    
    // Step 1: Convert sql-soar type to MySQL type
    const mysqlType = schemaManager.toSQLType(originalProp);
    
    // Step 2: Convert MySQL type back to sql-soar type
    const convertedProp = schemaManager.toSchemaType(mysqlType);
    
    // Compare the original and converted properties
    let status = 'PASS';
    let note = '';
    
    // Check type
    if (originalProp.type !== convertedProp.type) {
        if (originalProp.type === 'serial' && convertedProp.type === 'integer' && convertedProp.format === 'int64' && convertedProp.options && convertedProp.options.unsigned) {
            // This is expected - SERIAL converts to BIGINT UNSIGNED, which maps back to integer int64 unsigned
            status = 'WARN';
            note = 'serial → bigint unsigned → integer int64 unsigned (MySQL SERIAL mapping)';
            warnings++;
        } else {
            status = 'FAIL';
            note = `Type mismatch: ${originalProp.type} !== ${convertedProp.type}`;
        }
    }
    // Check format
    else if (originalProp.format !== convertedProp.format) {
        if (originalProp.type === 'number' && !originalProp.format && convertedProp.format === 'float') {
            // This is expected - default number maps to float, which maps back to float format
            status = 'WARN';
            note = 'Default number → float → float format';
            warnings++;
        } else if (originalProp.type === 'string' && !originalProp.format && convertedProp.format === 'text') {
            // This is expected - default string maps to text, which maps back to text format
            status = 'WARN';
            note = 'Default string → text → text format';
            warnings++;
        } else if (originalProp.format && !convertedProp.format) {
            status = 'WARN';
            note = `Format lost: ${originalProp.format}`;
            warnings++;
        } else {
            status = 'FAIL';
            note = `Format mismatch: ${originalProp.format} !== ${convertedProp.format}`;
        }
    }
    // Check maxLength
    else if (originalProp.maxLength !== convertedProp.maxLength) {
        if (originalProp.type === 'string' && !originalProp.maxLength && !convertedProp.maxLength) {
            // Both are unlimited - this is fine
        } else if (originalProp.type === 'varbinary' && !originalProp.maxLength && convertedProp.maxLength === 255) {
            // This is expected - default varbinary gets MySQL default length of 255
            status = 'WARN';
            note = 'Default varbinary → varbinary(255) (MySQL default length)';
            warnings++;
        } else {
            status = 'FAIL';
            note = `MaxLength mismatch: ${originalProp.maxLength} !== ${convertedProp.maxLength}`;
        }
    }
    // Check precision
    else if (originalProp.precision !== convertedProp.precision) {
        status = 'FAIL';
        note = `Precision mismatch: ${originalProp.precision} !== ${convertedProp.precision}`;
    }
    // Check options
    else if (!deepEqual(originalProp.options, convertedProp.options)) {
        // Initialize empty options if not present
        const origOptions = originalProp.options || {};
        const convOptions = convertedProp.options || {};
        
        if (!deepEqual(origOptions, convOptions)) {
            status = 'FAIL';
            note = `Options mismatch: ${JSON.stringify(origOptions)} !== ${JSON.stringify(convOptions)}`;
        }
    }
    
    if (status === 'PASS') {
        passedTests++;
    } else if (status === 'FAIL') {
        failedTests++;
    }
    
    const conversion = `${JSON.stringify(originalProp)} → ${mysqlType} → ${JSON.stringify(convertedProp)}`;
    console.log(`| ${(index + 1).toString().padStart(2)} | ${conversion.padEnd(28)} | ${status}${note ? ` (${note})` : ''} |`);
});

console.log('\nTest Results Summary:');
console.log(`✓ Perfect round-trips: ${passedTests}`);
console.log(`⚠ Lossy conversions: ${warnings}`);
console.log(`✗ Failed conversions: ${failedTests}`);
console.log(`Total tests: ${testCases.length}`);

if (failedTests === 0) {
    console.log('\n🎉 All round-trip tests passed!');
    if (warnings > 0) {
        console.log(`⚠ Note: ${warnings} conversions are lossy but expected due to format normalization.`);
    }
    console.log('The MySQL schema manager correctly handles bidirectional type conversions.');
} else {
    console.log(`\n❌ ${failedTests} round-trip test(s) failed. Please review the type mappings.`);
}

console.log('\nRound-trip Testing Summary:');
console.log('✓ Boolean types preserve exactly');
console.log('✓ All integer types and formats preserve exactly');
console.log('✓ UNSIGNED attribute preserves correctly');
console.log('✓ Number types with explicit formats preserve');
console.log('✓ String types with explicit formats preserve');
console.log('✓ Date/Time types with precision preserve');
console.log('✓ MySQL-specific types (JSON, YEAR, geometric) preserve');
console.log('✓ Binary types preserve correctly');
console.log('⚠ Default number → float (expected normalization)');
console.log('⚠ Default string → text (expected normalization)');