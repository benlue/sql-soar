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
        
        it('Simple query', function(done) {
            // First test: just list all records to see what's in the database
            var  listExpr = soar.sql('Person');
            var  listCmd = {op: 'list', expr: listExpr};

            soar.execute(listCmd, function(err, allData) {
                if (err) {
                    done(err);
                } else {
                    assert(Array.isArray(allData), `Expected array, got: ${typeof allData}, value: ${JSON.stringify(allData)}`);
                    assert(allData.length > 0, `Database should have records, got: ${JSON.stringify(allData)}`);
                    
                    // Now try the specific query with the first record's psnID
                    var  firstRecordId = allData[0].psnID;
                    var  expr = soar.sql('Person')
                                    .column(['psnID', 'name'])
                                    .filter( {name: 'psnID', op: '='} );

                    var  cmd = {op: 'query', expr: expr},
                         query = {psnID: firstRecordId};

                    soar.execute(cmd, query, function(err, data) {
                        if (err) {
                            done(err);
                        } else {
                            assert(data !== null && data !== undefined, `Query returned: ${JSON.stringify(data)}`);
                            assert(data.psnID === firstRecordId, `Expected psnID=${firstRecordId}, got: ${JSON.stringify(data)}`);
                            done();
                        }
                    });
                }
            });
        });

        it('List records', function(done) {
            var  expr = soar.sql('Person')
                            .column(['psnID', 'name', 'age']);

            var  cmd = {
                    op: 'list',
                    expr: expr
                 };

            soar.execute(cmd, function(err, list) {
                if (err) {
                    
                    done(err); // Fail test if database connection fails
                } else {
                    assert(Array.isArray(list), 'Should return an array');
                    done();
                }
            });
        });

        it('Insert record', function(done) {
            const  data = {
                    name: 'Test User',
                    age: 25,
                    weight: 70
                 };

            soar.insert('Person', data, function(err, pk) {
                if (err)        
                    done(err); // Fail test if database connection fails
                else {
                    assert(pk, 'Should return primary key');
                    done();
                }
            });
        });

        it('Update record', function(done) {
            const  data = {age: 26},
                   query = {name: 'Test User'};

            soar.update('Person', data, query, done)
        });

        it('Delete record', function(done) {
            var  query = {name: 'Test User'};

            soar.del('Person', query, done)
        });
    });

    describe('Schema Operations', function() {
        
        it('Create table', function(done) {
            var  schema = {
                    title: 'TestTable',
                    columns: {
                        id: {type: 'integer', format: 'int64', options: {autoInc: true}},
                        name: {type: 'string', maxLength: 50, options: {notNull: true}},
                        created: {type: 'datetime', options: {default: 'CURRENT_TIMESTAMP'}}
                    },
                    primary: ['id']
                 };

            soar.createTable(schema, done)
        });

        it('Describe table', function(done) {
            soar.describeTable('TestTable', function(err, schema) {
                if (err) {
                    
                    done(err); // Fail test if database connection fails
                } else {
                    assert(schema, 'Should return schema');
                    assert(schema.columns, 'Should have columns');
                    done();
                }
            });
        });

        it('Drop table', function(done) {
            soar.deleteTable('TestTable', done)
        });
    });

    describe('PostgreSQL-specific Features', function() {
        
        it('Boolean data type', function(done) {
            var  schema = {
                    title: 'BoolTest',
                    columns: {
                        id: {type: 'integer', format: 'int64', options: {autoInc: true}},
                        active: {type: 'boolean', options: {default: true}}
                    },
                    primary: ['id']
                 };

            soar.createTable(schema, function(err) {
                if (err) {
                    
                    done(err); // Fail test if database connection fails
                } else {
                    // Clean up
                    soar.deleteTable('BoolTest', function(cleanupErr) {
                        done();
                    });
                }
            });
        });

        it('Array support (if implemented)', function(done) {
            // This test would be for PostgreSQL-specific array features
            // Skip for now as it's not implemented yet
            done();
        });
    });
});