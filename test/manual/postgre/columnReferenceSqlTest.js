/**
 * Unit test for @ column reference SQL generation in PostgreSQL
 * Tests only SQL generation without requiring database connection
 */
const sqlGenPostgreSQL = require('../../../lib/sql/sqlGenPostgreSQL');
const sqlComp = require('../../../lib/sql/sqlComp');

console.log('Testing @ column reference SQL generation for PostgreSQL...\n');

// Mock table schema for PostgreSQL tests
const mockSchema = {
    columns: {
        id: { type: 'INTEGER', primaryKey: true },
        name: { type: 'VARCHAR(100)' },
        age: { type: 'INTEGER' },
        weight: { type: 'INTEGER' },
        created_date: { type: 'TIMESTAMP' }
    },
    primary: ['id']
};

// Test 1: Basic column comparison with explicit operator
console.log('Test 1: Basic column comparison (age > @weight)');
const expr1 = new sqlComp('Person');
expr1.column(['id', 'name', 'age', 'weight']);
expr1.filter({name: 'age', op: '>'});

const cmd1 = {
    op: 'list',
    expr: expr1.value(),
    tableSchema: mockSchema,
    debug: true
};

const params1 = [];
const sql1 = sqlGenPostgreSQL.toSQL(cmd1, null, {age: '@weight'}, params1);
console.log('Generated SQL:', sql1);
console.log('Parameters:', params1);
console.log('Expected: SQL should contain "age" > "weight" and parameters should be empty\n');

// Test 2: Column comparison with implicit equality
console.log('Test 2: Column comparison with implicit equality (age = @created_date)');
const expr2 = new sqlComp('Person');
expr2.column(['id', 'name', 'age', 'created_date']);
expr2.filter({name: 'age', op: '='});

const cmd2 = {
    op: 'list',
    expr: expr2.value(),
    tableSchema: mockSchema,
    debug: true
};

const params2 = [];
const sql2 = sqlGenPostgreSQL.toSQL(cmd2, null, {age: '@created_date'}, params2);
console.log('Generated SQL:', sql2);
console.log('Parameters:', params2);
console.log('Expected: SQL should contain "age" = "created_date" and parameters should be empty\n');

// Test 3: Mixed filters - some with @ column references, some with regular values
console.log('Test 3: Mixed filters (age > @weight AND name LIKE $1)');
const expr3 = new sqlComp('Person');
expr3.column(['id', 'name', 'age', 'weight']);
expr3.filter([
    {name: 'age', op: '>'},
    {name: 'name', op: 'LIKE'}
]);

const cmd3 = {
    op: 'list',
    expr: expr3.value(),
    tableSchema: mockSchema,
    debug: true
};

const params3 = [];
const sql3 = sqlGenPostgreSQL.toSQL(cmd3, null, {age: '@weight', name: 'John%'}, params3);
console.log('Generated SQL:', sql3);
console.log('Parameters:', params3);
console.log('Expected: SQL should contain "age" > "weight" AND "name" LIKE $1 and parameters should be ["John%"]\n');

// Test 4: Regular parameter (no @ prefix) should work as before
console.log('Test 4: Regular parameter handling (age >= $1)');
const expr4 = new sqlComp('Person');
expr4.column(['id', 'name', 'age']);
expr4.filter({name: 'age', op: '>='});

const cmd4 = {
    op: 'list',
    expr: expr4.value(),
    tableSchema: mockSchema,
    debug: true
};

const params4 = [];
const sql4 = sqlGenPostgreSQL.toSQL(cmd4, null, {age: 25}, params4);
console.log('Generated SQL:', sql4);
console.log('Parameters:', params4);
console.log('Expected: SQL should contain "age" >= $1 and parameters should be [25]\n');

// Test 5: Column reference with table aliases (p.age > p.weight)
console.log('Test 5: Column reference with table aliases (p."age" > p."weight")');
const expr5 = new sqlComp('Person AS p');
expr5.column(['p.id', 'p.name', 'p.age', 'p.weight']);
expr5.filter({name: 'p.age', op: '>'});

const cmd5 = {
    op: 'list',
    expr: expr5.value(),
    tableSchema: mockSchema,
    debug: true
};

const params5 = [];
const sql5 = sqlGenPostgreSQL.toSQL(cmd5, null, {age: '@p.weight'}, params5);
console.log('Generated SQL:', sql5);
console.log('Parameters:', params5);
console.log('Expected: SQL should contain p."age" > p."weight" and parameters should be empty\n');

console.log('PostgreSQL SQL generation tests completed.');