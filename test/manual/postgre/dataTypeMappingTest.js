const PostgreSQLSchemaManager = require('../../../lib/postgreSchemaManager');

console.log('Testing PostgreSQL toSQLType() data type mappings...\n');

// Create PostgreSQL schema manager
const schemaManager = new PostgreSQLSchemaManager();

// Test cases for different sql-soar internal data types
const testCases = [
    // Boolean type
    { type: 'boolean', expected: 'boolean' },
    
    // Integer types with different formats
    { type: 'integer', format: 'int8', expected: 'smallint' },
    { type: 'integer', format: 'int16', expected: 'smallint' },
    { type: 'integer', format: 'int64', expected: 'bigint' },
    { type: 'integer', expected: 'integer' }, // default integer
    
    // Number/float types
    { type: 'number', format: 'float', expected: 'real' },
    { type: 'number', format: 'double', expected: 'double precision' },
    { type: 'number', format: 'decimal(10,2)', expected: 'numeric(10,2)' },
    { type: 'number', expected: 'real' }, // default number
    
    // String types
    { type: 'string', format: 'text', expected: 'text' },
    { type: 'string', maxLength: 50, expected: 'varchar(50)' },
    { type: 'string', expected: 'text' }, // no maxLength specified
    
    // Serial types (auto-increment)
    { type: 'serial', expected: 'serial' },
    { type: 'serial', format: 'int16', expected: 'smallserial' },
    { type: 'serial', format: 'int64', expected: 'bigserial' },
    
    // PostgreSQL-specific types
    { type: 'uuid', expected: 'uuid' },
    { type: 'json', expected: 'json' },
    { type: 'jsonb', expected: 'jsonb' },
    { type: 'date', expected: 'date' },
    { type: 'timestamp', expected: 'timestamp without time zone' },
    { type: 'timestamp', withTimeZone: true, expected: 'timestamp with time zone' },
    { type: 'time', expected: 'time without time zone' },
    { type: 'time', withTimeZone: true, expected: 'time with time zone' },
    
    // Unknown type (should pass through)
    { type: 'unknown_type', expected: 'unknown_type' }
];

let passedTests = 0;
let failedTests = 0;

console.log('Running data type mapping tests:\n');

testCases.forEach((testCase, index) => {
    const prop = {
        type: testCase.type,
        format: testCase.format,
        maxLength: testCase.maxLength,
        withTimeZone: testCase.withTimeZone
    };
    
    const result = schemaManager.toSQLType(prop);
    const passed = result === testCase.expected;
    
    if (passed) {
        passedTests++;
        console.log(`✓ Test ${index + 1}: ${testCase.type}${testCase.format ? ` (${testCase.format})` : ''}${testCase.maxLength ? ` (maxLength: ${testCase.maxLength})` : ''}${testCase.withTimeZone ? ' (with timezone)' : ''} → ${result}`);
    } else {
        failedTests++;
        console.log(`✗ Test ${index + 1}: ${testCase.type}${testCase.format ? ` (${testCase.format})` : ''}${testCase.maxLength ? ` (maxLength: ${testCase.maxLength})` : ''}${testCase.withTimeZone ? ' (with timezone)' : ''}`);
        console.log(`  Expected: ${testCase.expected}`);
        console.log(`  Got:      ${result}`);
    }
});

console.log(`\nTest Results:`);
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);
console.log(`Total:   ${testCases.length}`);

if (failedTests === 0) {
    console.log('\n🎉 All PostgreSQL data type mapping tests passed!');
} else {
    console.log(`\n❌ ${failedTests} test(s) failed. Please review the mappings.`);
}