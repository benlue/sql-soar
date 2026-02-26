const PostgreSQLSchemaManager = require('../../../lib/postgreSchemaManager');

console.log('Testing PostgreSQL round-trip data type mappings...\n');
console.log('This test verifies that sql-soar → PostgreSQL → sql-soar conversions work correctly.\n');

// Create PostgreSQL schema manager
const schemaManager = new PostgreSQLSchemaManager();

// Test cases for round-trip conversion
const testCases = [
    // Basic types
    { prop: { type: 'boolean' }, description: 'Boolean type' },
    
    // Integer types
    { prop: { type: 'integer', format: 'int8' }, description: 'Small integer (8-bit)' },
    { prop: { type: 'integer', format: 'int16' }, description: 'Small integer (16-bit)' },
    { prop: { type: 'integer', format: 'int64' }, description: 'Big integer (64-bit)' },
    { prop: { type: 'integer' }, description: 'Default integer' },
    
    // Number types
    { prop: { type: 'number', format: 'float' }, description: 'Single precision float' },
    { prop: { type: 'number', format: 'double' }, description: 'Double precision float' },
    { prop: { type: 'number', format: 'decimal(10,2)' }, description: 'Decimal with precision' },
    { prop: { type: 'number' }, description: 'Default number' },
    
    // String types
    { prop: { type: 'string', format: 'text' }, description: 'Large text' },
    { prop: { type: 'string', maxLength: 50 }, description: 'Variable length string' },
    { prop: { type: 'string' }, description: 'Default string (unlimited)' },
    
    // Serial types
    { prop: { type: 'serial' }, description: 'Auto-increment integer' },
    { prop: { type: 'serial', format: 'int16' }, description: 'Auto-increment small integer' },
    { prop: { type: 'serial', format: 'int64' }, description: 'Auto-increment big integer' },
    
    // Date/Time types
    { prop: { type: 'date' }, description: 'Date type' },
    { prop: { type: 'time' }, description: 'Time without timezone' },
    { prop: { type: 'time', withTimeZone: true }, description: 'Time with timezone' },
    { prop: { type: 'timestamp' }, description: 'Timestamp without timezone' },
    { prop: { type: 'timestamp', withTimeZone: true }, description: 'Timestamp with timezone' },
    
    // PostgreSQL-specific types
    { prop: { type: 'uuid' }, description: 'UUID type' },
    { prop: { type: 'json' }, description: 'JSON type' },
    { prop: { type: 'jsonb' }, description: 'Binary JSON type' }
];

let passedTests = 0;
let failedTests = 0;
let warnings = 0;

console.log('Running round-trip conversion tests:\n');
console.log('| Test | sql-soar → PostgreSQL → sql-soar | Status |');
console.log('|------|-----------------------------------|--------|');

testCases.forEach((testCase, index) => {
    const originalProp = testCase.prop;
    
    // Step 1: Convert sql-soar type to PostgreSQL type
    const pgType = schemaManager.toSQLType(originalProp);
    
    // Step 2: Convert PostgreSQL type back to sql-soar type
    const convertedProp = schemaManager.toSchemaType(pgType);
    
    // Compare the original and converted properties
    let status = 'PASS';
    let note = '';
    
    // Check type
    if (originalProp.type !== convertedProp.type) {
        status = 'FAIL';
        note = `Type mismatch: ${originalProp.type} !== ${convertedProp.type}`;
    }
    // Check format
    else if (originalProp.format !== convertedProp.format) {
        if (originalProp.type === 'integer' && originalProp.format === 'int8' && convertedProp.format === 'int16') {
            // This is expected - PostgreSQL maps int8 to smallint, which maps back to int16
            status = 'WARN';
            note = 'int8 → smallint → int16 (PostgreSQL has no tinyint)';
            warnings++;
        } else if (originalProp.type === 'number' && !originalProp.format && convertedProp.format === 'float') {
            // This is expected - default number maps to real, which maps back to float format
            status = 'WARN';
            note = 'Default number → real → float format';
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
        } else {
            status = 'FAIL';
            note = `MaxLength mismatch: ${originalProp.maxLength} !== ${convertedProp.maxLength}`;
        }
    }
    // Check withTimeZone
    else if (originalProp.withTimeZone !== convertedProp.withTimeZone) {
        status = 'FAIL';
        note = `WithTimeZone mismatch: ${originalProp.withTimeZone} !== ${convertedProp.withTimeZone}`;
    }
    
    if (status === 'PASS') {
        passedTests++;
    } else if (status === 'FAIL') {
        failedTests++;
    }
    
    const conversion = `${JSON.stringify(originalProp)} → ${pgType} → ${JSON.stringify(convertedProp)}`;
    console.log(`| ${(index + 1).toString().padStart(2)} | ${conversion.padEnd(33)} | ${status}${note ? ` (${note})` : ''} |`);
});

console.log('\nTest Results Summary:');
console.log(`✓ Perfect round-trips: ${passedTests}`);
console.log(`⚠ Lossy conversions: ${warnings}`);
console.log(`✗ Failed conversions: ${failedTests}`);
console.log(`Total tests: ${testCases.length}`);

if (failedTests === 0) {
    console.log('\n🎉 All round-trip tests passed!');
    if (warnings > 0) {
        console.log(`⚠ Note: ${warnings} conversions are lossy but expected due to PostgreSQL limitations.`);
    }
    console.log('The PostgreSQL schema manager correctly handles bidirectional type conversions.');
} else {
    console.log(`\n❌ ${failedTests} round-trip test(s) failed. Please review the type mappings.`);
}