/**
 * Test for @ column reference feature in MySQL
 */
const soar = require('../../../lib/soar');

// Configure for MySQL
soar.config({
    dbConfig: {
        type: "mysql",
        host: "127.0.0.1",
        port: 3306,
        database: "soar",
        user: "testuser",
        password: "testpass",
        connectionLimit: 10
    }
});

console.log('Testing @ column reference feature in MySQL...\n');

// Test 1: Basic column comparison with explicit operator
console.log('Test 1: Basic column comparison with explicit operator');
const expr1 = soar.sql('Person')
    .column(['id', 'name', 'age', 'weight'])
    .filter({name: 'age', op: '>', value: '@weight'});

const cmd1 = {list: expr1, debug: true};
soar.execute(cmd1, null, {age: '@weight'}, function(err, result) {
    if (err) {
        console.error('Test 1 Error:', err.message);
    } else {
        console.log('Test 1 Success: Generated SQL should show "age > weight" without parameters');
    }
    console.log('');
});

// Test 2: Column comparison with implicit equality
console.log('Test 2: Column comparison with implicit equality');
const expr2 = soar.sql('Person')
    .column(['id', 'name', 'age', 'created_date'])
    .filter({name: 'age'});

const cmd2 = {list: expr2, debug: true};
soar.execute(cmd2, null, {age: '@created_date'}, function(err, result) {
    if (err) {
        console.error('Test 2 Error:', err.message);
    } else {
        console.log('Test 2 Success: Generated SQL should show "age = created_date" without parameters');
    }
    console.log('');
});

// Test 3: Mixed filters - some with @ column references, some with regular values
console.log('Test 3: Mixed filters');
const expr3 = soar.sql('Person')
    .column(['id', 'name', 'age', 'weight'])
    .filter([
        {name: 'age', op: '>', value: '@weight'},
        {name: 'name', op: 'LIKE', value: 'John%'}
    ]);

const cmd3 = {list: expr3, debug: true};
soar.execute(cmd3, null, {age: '@weight', name: 'John%'}, function(err, result) {
    if (err) {
        console.error('Test 3 Error:', err.message);
    } else {
        console.log('Test 3 Success: Generated SQL should show "age > weight" and "name LIKE ?" with one parameter');
    }
    console.log('');
});

// Test 4: Regular parameter (no @ prefix) should work as before
console.log('Test 4: Regular parameter handling (regression test)');
const expr4 = soar.sql('Person')
    .column(['id', 'name', 'age'])
    .filter({name: 'age', op: '>=', value: 25});

const cmd4 = {list: expr4, debug: true};
soar.execute(cmd4, null, {age: 25}, function(err, result) {
    if (err) {
        console.error('Test 4 Error:', err.message);
    } else {
        console.log('Test 4 Success: Generated SQL should show "age >= ?" with parameter [25]');
    }
    console.log('');
});

console.log('Test completed. Check the generated SQL statements above.');