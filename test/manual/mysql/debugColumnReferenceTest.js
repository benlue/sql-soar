/**
 * Debug test to understand why WHERE clause is missing in some cases
 */
const sqlGenMySQL = require('../../../lib/sql/sqlGenMySql');
const sqlComp = require('../../../lib/sql/sqlComp');

console.log('Debug: Checking filter setup and SQL generation...\n');

// Test 2 debug: Check the filter structure
console.log('Test 2 Debug: Column comparison with implicit equality');
const expr2 = new sqlComp('Person');
expr2.column(['id', 'name', 'age', 'created_date']);
expr2.filter({name: 'age'});

const cmd2 = {
    op: 'list',
    expr: expr2.value(),
    debug: true
};

console.log('Expression structure:', JSON.stringify(cmd2.expr, null, 2));
console.log('Query object:', {age: '@created_date'});

const params2 = [];
const sql2 = sqlGenMySQL.toSQL(cmd2, null, {age: '@created_date'}, params2);
console.log('Generated SQL:', sql2);
console.log('Parameters:', params2);
console.log('');

// Test with explicit operator for comparison
console.log('Test 2b: Same filter but with explicit = operator');
const expr2b = new sqlComp('Person');
expr2b.column(['id', 'name', 'age', 'created_date']);
expr2b.filter({name: 'age', op: '='});

const cmd2b = {
    op: 'list',
    expr: expr2b.value(),
    debug: true
};

console.log('Expression structure:', JSON.stringify(cmd2b.expr, null, 2));
console.log('Query object:', {age: '@created_date'});

const params2b = [];
const sql2b = sqlGenMySQL.toSQL(cmd2b, null, {age: '@created_date'}, params2b);
console.log('Generated SQL:', sql2b);
console.log('Parameters:', params2b);
console.log('');

// Test 5 debug: Check the filter structure with aliases
console.log('Test 5 Debug: Column reference with table aliases');
const expr5 = new sqlComp('Person AS p');
expr5.column(['p.id', 'p.name', 'p.age', 'p.weight']);
expr5.filter({name: 'p.age'});

const cmd5 = {
    op: 'list',
    expr: expr5.value(),
    debug: true
};

console.log('Expression structure:', JSON.stringify(cmd5.expr, null, 2));
console.log('Query object:', {'p.age': '@p.weight'});

const params5 = [];
const sql5 = sqlGenMySQL.toSQL(cmd5, null, {'p.age': '@p.weight'}, params5);
console.log('Generated SQL:', sql5);
console.log('Parameters:', params5);

console.log('\nDebug completed.');