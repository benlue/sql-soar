/**
 * Debug Test 5 specifically - table aliases with dotted field names
 */
const sqlGenMySQL = require('../../../lib/sql/sqlGenMySql');
const sqlComp = require('../../../lib/sql/sqlComp');

console.log('Debug Test 5: Table aliases with dotted field names\n');

const expr5 = new sqlComp('Person AS p');
expr5.column(['p.id', 'p.name', 'p.age', 'p.weight']);
expr5.filter({name: 'p.age', op: '>'});

const cmd5 = {
    op: 'list',
    expr: expr5.value(),
    debug: true
};

console.log('Filter structure:', JSON.stringify(cmd5.expr.filters, null, 2));
console.log('Query object keys:', Object.keys({'p.age': '@p.weight'}));
console.log('Query object:', {'p.age': '@p.weight'});

const params5 = [];
const sql5 = sqlGenMySQL.toSQL(cmd5, null, {'p.age': '@p.weight'}, params5);
console.log('Generated SQL:', sql5);
console.log('Parameters:', params5);

// Try a different approach - use age without the p. prefix in the query
console.log('\nTrying with query key "age" instead of "p.age":');
const params5b = [];
const sql5b = sqlGenMySQL.toSQL(cmd5, null, {'age': '@p.weight'}, params5b);
console.log('Generated SQL:', sql5b);
console.log('Parameters:', params5b);

console.log('\nDebug completed.');