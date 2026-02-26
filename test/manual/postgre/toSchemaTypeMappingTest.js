const PostgreSQLSchemaManager = require('../../../lib/postgreSchemaManager');

console.log('Testing PostgreSQL toSchemaType() reverse data type mappings...\n');

// Create PostgreSQL schema manager
const schemaManager = new PostgreSQLSchemaManager();

// Test cases for converting PostgreSQL data types back to sql-soar schema types
const testCases = [
    // Basic types
    { pgType: 'boolean', expected: { type: 'boolean', options: {} } },
    
    // Integer types
    { pgType: 'smallint', expected: { type: 'integer', format: 'int16', options: {} } },
    { pgType: 'integer', expected: { type: 'integer', options: {} } },
    { pgType: 'bigint', expected: { type: 'integer', format: 'int64', options: {} } },
    
    // Floating point types
    { pgType: 'real', expected: { type: 'number', format: 'float', options: {} } },
    { pgType: 'double precision', expected: { type: 'number', format: 'double', options: {} } },
    
    // String types
    { pgType: 'text', expected: { type: 'string', format: 'text', options: {} } },
    { pgType: 'character varying', expected: { type: 'string', options: {} } },
    { pgType: 'varchar', expected: { type: 'string', options: {} } },
    { pgType: 'character', expected: { type: 'string', options: {} } },
    { pgType: 'char', expected: { type: 'string', options: {} } },
    
    // Serial types (auto-increment)
    { pgType: 'serial', expected: { type: 'serial', options: {} } },
    { pgType: 'smallserial', expected: { type: 'serial', format: 'int16', options: {} } },
    { pgType: 'bigserial', expected: { type: 'serial', format: 'int64', options: {} } },
    
    // Date/Time types
    { pgType: 'date', expected: { type: 'date', options: {} } },
    { pgType: 'time without time zone', expected: { type: 'time', options: {} } },
    { pgType: 'time with time zone', expected: { type: 'time', withTimeZone: true, options: {} } },
    { pgType: 'timestamp without time zone', expected: { type: 'timestamp', options: {} } },
    { pgType: 'timestamp with time zone', expected: { type: 'timestamp', withTimeZone: true, options: {} } },
    { pgType: 'interval', expected: { type: 'interval', options: {} } },
    
    // PostgreSQL-specific types
    { pgType: 'uuid', expected: { type: 'uuid', options: {} } },
    { pgType: 'json', expected: { type: 'json', options: {} } },
    { pgType: 'jsonb', expected: { type: 'jsonb', options: {} } },
    { pgType: 'bytea', expected: { type: 'binary', options: {} } },
    
    // Network types
    { pgType: 'inet', expected: { type: 'inet', options: {} } },
    { pgType: 'cidr', expected: { type: 'cidr', options: {} } },
    { pgType: 'macaddr', expected: { type: 'macaddr', options: {} } },
    
    // Geometric types
    { pgType: 'point', expected: { type: 'point', options: {} } },
    { pgType: 'line', expected: { type: 'line', options: {} } },
    { pgType: 'lseg', expected: { type: 'lseg', options: {} } },
    { pgType: 'box', expected: { type: 'box', options: {} } },
    { pgType: 'path', expected: { type: 'path', options: {} } },
    { pgType: 'polygon', expected: { type: 'polygon', options: {} } },
    { pgType: 'circle', expected: { type: 'circle', options: {} } },
    
    // Types with parameters (handled in !isSolved section)
    { pgType: 'numeric(10,2)', expected: { type: 'number', format: 'decimal(10,2)', options: {} } },
    { pgType: 'character varying(50)', expected: { type: 'string', maxLength: 50, options: {} } },
    { pgType: 'character(10)', expected: { type: 'string', maxLength: 10, options: {} } },
    { pgType: 'varchar(100)', expected: { type: 'string', maxLength: 100, options: {} } },
    
    // Array types
    { pgType: 'integer[]', expected: { type: 'array', arrayOf: { type: 'integer', options: {} }, options: {} } },
    { pgType: 'text[]', expected: { type: 'array', arrayOf: { type: 'string', format: 'text', options: {} }, options: {} } },
    
    // Unknown type (should pass through)
    { pgType: 'custom_type', expected: { type: 'custom_type', options: {} } }
];

let passedTests = 0;
let failedTests = 0;

console.log('Running PostgreSQL toSchemaType() tests:\n');

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
    const result = schemaManager.toSchemaType(testCase.pgType);
    const passed = deepEqual(result, testCase.expected);
    
    if (passed) {
        passedTests++;
        console.log(`✓ Test ${index + 1}: ${testCase.pgType} → ${JSON.stringify(result)}`);
    } else {
        failedTests++;
        console.log(`✗ Test ${index + 1}: ${testCase.pgType}`);
        console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`  Got:      ${JSON.stringify(result)}`);
    }
});

console.log(`\nTest Results:`);
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);
console.log(`Total:   ${testCases.length}`);

if (failedTests === 0) {
    console.log('\n🎉 All PostgreSQL toSchemaType() mapping tests passed!');
    console.log('The function properly converts PostgreSQL data types to sql-soar schema format.');
} else {
    console.log(`\n❌ ${failedTests} test(s) failed. Please review the reverse mappings.`);
}