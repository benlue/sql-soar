/**
 * sql-soar mySQL test cases
 * @author Ben Lue
 * @copyright 2023 ~ 2025 Conwell Inc.
 */
const  assert = require('assert'),
       soar = require('../../../lib/soar.js');

const  DB_HOST = '192.168.100.77'

describe('Multi-Database with PostgreSQL Support', function()  {

    before(function() {
        // Configure both MySQL and PostgreSQL databases
        soar.config([
            {
                "dbConfig": {
                    "alias": "mysql_db",
                    "type": "mysql",
                    "host": "127.0.0.1",
                    "database": "soar",
                    "user": "your_acc",
                    "password": "your_passwd",
                    "supportBigNumbers": true,
                    "connectionLimit": 8
                }
            },
            {
                "dbConfig": {
                    "alias": "postgres_db",
                    "type": "postgresql",
                    "host": DB_HOST,
                    "port": 5432,
                    "database": "soar",
                    "user": "soaruser",
                    "password": "1234soar",
                    "connectionLimit": 8
                }
            }
        ]);
    });

    describe('Cross-Database Operations', function() {
        
        it('Query from MySQL database', function(done) {
            var  expr = soar.sql('mysql_db.Person')
                            .column(['psnID', 'name'])
                            .filter( {name: 'psnID', op: '='} );

            var  cmd = {
                    op: 'query',
                    expr: expr
                 },
                 query = {psnID: 1};

            soar.execute(cmd, query, function(err, data) {
                if (err) {
                    
                    done(err); // Fail test if database connection fails
                } else {
                    assert(data, 'Missing MySQL data');
                    done();
                }
            });
        });

        it('Query from PostgreSQL database', function(done) {
            var  expr = soar.sql('postgres_db.Person')
                            .column(['psnID', 'name'])
                            .filter( {name: 'psnID', op: '='} );

            var  cmd = {
                    op: 'query',
                    expr: expr
                 },
                 query = {psnID: 1};

            soar.execute(cmd, query, function(err, data) {
                if (err) {
                    
                    done(err); // Fail test if database connection fails
                } else {
                    assert(data, 'Missing PostgreSQL data');
                    done();
                }
            });
        });

        it('Create table in MySQL', function(done) {
            var  schema = {
                    title: 'TestTableMySQL',
                    columns: {
                        id: {type: 'integer', format: 'int64', options: {autoInc: true}},
                        name: {type: 'string', maxLength: 50, options: {notNull: true}},
                        created: {type: 'datetime', options: {default: 'CURRENT_TIMESTAMP'}}
                    },
                    primary: ['id']
                 };

            // Get MySQL connection
            soar.getConnection('mysql_db', function(err, conn) {
                if (err) {
                    console.log('MySQL connection error:', err.message);
                    done();
                    return;
                }

                soar.createTable(conn, schema, function(createErr) {
                    conn.release();
                    if (createErr) {
                        console.log('MySQL create table error:', createErr.message);
                    }
                    done();
                });
            });
        });

        it('Create table in PostgreSQL', function(done) {
            var  schema = {
                    title: 'TestTablePostgreSQL',
                    columns: {
                        id: {type: 'integer', format: 'int64', options: {autoInc: true}},
                        name: {type: 'string', maxLength: 50, options: {notNull: true}},
                        active: {type: 'boolean', options: {default: true}}
                    },
                    primary: ['id']
                 };

            // Get PostgreSQL connection
            soar.getConnection('postgres_db', function(err, conn) {
                if (err) {
                    console.log('PostgreSQL connection error:', err.message);
                    done();
                    return;
                }

                soar.createTable(conn, schema, function(createErr) {
                    conn.release();
                    if (createErr) {
                        console.log('PostgreSQL create table error:', createErr.message);
                    }
                    done();
                });
            });
        });

        it('Compare SQL generation between databases', function() {
            // This test compares the SQL generated for the same schema
            // across different database types
            
            var  schema = {
                    title: 'CompareTest',
                    columns: [
                        {title: 'id', type: 'INTEGER', options: {autoInc: true}},
                        {title: 'name', type: 'VARCHAR(50)', options: {notNull: true}}
                    ],
                    primary: ['id']
                 };

            // Load SQL generators directly
            var  sqlGenMySQL = require('../../../lib/sql/sqlGenMySql.js'),
                 sqlGenPostgreSQL = require('../../../lib/sql/sqlGenPostgreSQL.js');

            var  mysqlSQL = sqlGenMySQL.createTable(schema),
                 postgresSQL = sqlGenPostgreSQL.createTable(schema);

            console.log('MySQL SQL:', mysqlSQL);
            console.log('PostgreSQL SQL:', postgresSQL);

            // Basic assertions
            assert(mysqlSQL.includes('CREATE TABLE'), 'MySQL should generate CREATE TABLE');
            assert(postgresSQL.includes('CREATE TABLE'), 'PostgreSQL should generate CREATE TABLE');
            assert(mysqlSQL.includes('`'), 'MySQL should use backticks');
            assert(postgresSQL.includes('"'), 'PostgreSQL should use double quotes');
        });
    });

    after(function(done) {
        // Clean up test tables
        var cleanupCount = 0;
        var expectedCleanups = 2;

        function checkDone() {
            cleanupCount++;
            if (cleanupCount >= expectedCleanups) {
                done();
            }
        }

        // Clean up MySQL table
        soar.getConnection('mysql_db', function(err, conn) {
            if (!err) {
                soar.deleteTable(conn, 'TestTableMySQL', function() {
                    conn.release();
                    checkDone();
                });
            } else {
                checkDone();
            }
        });

        // Clean up PostgreSQL table  
        soar.getConnection('postgres_db', function(err, conn) {
            if (!err) {
                soar.deleteTable(conn, 'TestTablePostgreSQL', function() {
                    conn.release();
                    checkDone();
                });
            } else {
                checkDone();
            }
        });
    });
});