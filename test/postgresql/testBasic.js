/**
 * sql-soar postgreSQL test cases
 * @author Ben Lue
 * @copyright 2023 ~ 2025 Conwell Inc.
 */
const  assert = require('assert'),
       soar = require('../../lib/soar.js');


describe('PostgreSQL Database Tests', function()  {

    before(function() {
        // Configure for PostgreSQL
        soar.config({dbConfig: require('./config.json')})
    });

    describe('Basic CRUD Operations', function() {

        it('Simple query', async function() {
            // First test: just list all records to see what's in the database
            var  listExpr = soar.sql('Person');
            var  listCmd = {op: 'list', expr: listExpr};

            const  allData = await soar.execute(listCmd);
            assert(Array.isArray(allData), `Expected array, got: ${typeof allData}, value: ${JSON.stringify(allData)}`);
            assert(allData.length > 0, `Database should have records, got: ${JSON.stringify(allData)}`);

            // Now try the specific query with the first record's psnID
            var  firstRecordId = allData[0].psnID;
            var  expr = soar.sql('Person')
                            .column(['psnID', 'name'])
                            .filter( {name: 'psnID', op: '='} );

            var  cmd = {op: 'query', expr: expr},
                 query = {psnID: firstRecordId};

            const  data = await soar.execute(cmd, query);
            assert(data !== null && data !== undefined, `Query returned: ${JSON.stringify(data)}`);
            assert(data.psnID === firstRecordId, `Expected psnID=${firstRecordId}, got: ${JSON.stringify(data)}`);
        });

        it('List records', async function() {
            var  expr = soar.sql('Person')
                            .column(['psnID', 'name', 'age']);

            var  cmd = {
                    op: 'list',
                    expr: expr
                 };

            const  list = await soar.execute(cmd);
            assert(Array.isArray(list), 'Should return an array');
        });

        it('Insert record', async function() {
            const  data = {
                    name: 'Test User',
                    age: 25,
                    weight: 70
                 };

            const  pk = await soar.insert('Person', data);
            assert(pk, 'Should return primary key');
        });

        it('Update record', async function() {
            const  data = {age: 26},
                   query = {name: 'Test User'};

            await soar.update('Person', data, query);
        });

        it('Delete record', async function() {
            var  query = {name: 'Test User'};

            await soar.del('Person', query);
        });
    });

    describe('Schema Operations', function() {

        it('Create table', async function() {
            var  schema = {
                    title: 'TestTable',
                    columns: {
                        id: {type: 'integer', format: 'int64', options: {autoInc: true}},
                        name: {type: 'string', maxLength: 50, options: {notNull: true}},
                        created: {type: 'datetime', options: {default: 'CURRENT_TIMESTAMP'}}
                    },
                    primary: ['id']
                 };

            await soar.createTable(schema);
        });

        it('Describe table', async function() {
            const  schema = await soar.describeTable('TestTable');
            assert(schema, 'Should return schema');
            assert(schema.columns, 'Should have columns');
        });

        it('Drop table', async function() {
            await soar.deleteTable('TestTable');
        });
    });

    describe('PostgreSQL-specific Features', function() {

        it('Boolean data type', async function() {
            var  schema = {
                    title: 'BoolTest',
                    columns: {
                        id: {type: 'integer', format: 'int64', options: {autoInc: true}},
                        active: {type: 'boolean', options: {default: true}}
                    },
                    primary: ['id']
                 };

            await soar.createTable(schema);
            // Clean up
            await soar.deleteTable('BoolTest');
        });

        it('Array support (if implemented)', async function() {
            // This test would be for PostgreSQL-specific array features
            // Skip for now as it's not implemented yet
        });
    });
});
