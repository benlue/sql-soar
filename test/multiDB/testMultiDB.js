/*!
* sql-soar
* authors: Ben Lue
* license: MIT License
* Copyright(c) 2015 Gocharm Inc.
*/
var  assert = require('assert'),
     path = require('path'),
     soar = require('../lib/soar.js');

//soar.setDebug( true );

before(function() {
    soar.config([
        {
            "dbConfig": {
                "host"     : "127.0.0.1",
                "database" : "soar",
                "user"     : "your_acc",
                "password" : "your_passwd",
                "supportBigNumbers" : true,
                "connectionLimit"   : 16
            }
        },
        {
            "dbConfig": {
                "host"     : "127.0.0.1",
                "database" : "soar2",
                "user"     : "your_acc",
                "password" : "your_passwd",
                "supportBigNumbers" : true,
                "connectionLimit"   : 16
            }
        }
    ]);
});


describe('Access multiple databases', function()  {

    it('Simple query', function(done) {
        var  expr = soar.sql('soar.Person')
                        .column(['psnID', 'name'])
                        .filter( {name: 'psnID', op: '='} );

        var  cmd = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        soar.execute(cmd, query, function(err, data) {
            assert( data, 'Missing psnID=1 data');
            assert.equal( data.name, 'John', 'Person name not matched.');
            
            expr = soar.sql('soar2.Person')
                       .filter( {name: 'psnID', op: '='} );
            cmd.expr = expr;
            
            soar.execute(cmd, query, function(err, data) {
                assert.equal( data.name, 'Steve', 'name should be Steve');
                done();
            });
        });
    });

    it('List query', function(done) {
        var  expr = soar.sql('soar.Person')
                        .filter( {name: 'psnID', op: '='} ),
             cmd = {
                 op: 'list',
                 expr: expr
             };
        soar.execute(cmd, null, function(err, list) {
            assert.equal( list.length, 5, 'Should have 5 persons.');

            expr = soar.sql('soar2.Person')
                       .filter( {name: 'psnID', op: '='} );
            cmd.expr = expr;

            soar.execute( cmd, null, function(err, list) {
                console
                assert.equal( list.length, 3, 'Should return 3 records.');
                assert.equal(list[2].name, 'Jeremy', 'Person #3 is Jeremy.');
                done();
            });
        });
    });

    it('Update', function(done) {
        var  expr = soar.sql('soar.Person')
                        .filter( {name: 'psnID', op: '='} ),
             cmd = {
                 op: 'update',
                 expr: expr
             },
             data = {name: 'John Mayer'};

        soar.execute(cmd, data, {psnID: 1}, function(err) {
            assert(!err, 'Failed to do update.');
            
            cmd.op = 'query';
            soar.execute(cmd, {psnID: 1}, function(err, data) {
                assert.equal( data.name, 'John Mayer', 'Person name not matched.');

                // restore data
                data = {name: 'John'};
                cmd.op = 'update';
                soar.execute(cmd, data, {psnID: 1}, function(err) {
                    assert(!err, 'Failed to do update.');
                    done();
                });
            });
        })
    });

    it('Insert and delete with transactions', function(done) {
        soar.getConnection( 'soar', function(err, conn) {
            assert(!err, 'Failed to create connection.');

            conn.beginTransaction(function(err) {
                assert(!err, 'Transaction failed to get started.');

                var  data = {name: 'Scott Cooper'},
                     expr = soar.sql('Person')
                                .filter( {name: 'psnID', op: '='} ),
                     cmd = {
                         op: 'insert',
                         expr: expr,
                         conn: conn
                     };

                soar.execute(cmd, data, null, function(err, psnPK) {
                    assert(psnPK, 'Failed to insert');

                    cmd.op = 'delete';
                    soar.execute(cmd, psnPK, function(err) {
                        assert(!err, 'Failed to delete.');
                        conn.commit( function(err) {
                            assert(!err, 'Transaction failed to commit.');
                            conn.release();
                            done();
                        });
                    });
                });
            });
        });
    });
 
    it('Test fields with query', function(done) {
        var  expr = soar.sql('soar2.Person')
                        .column(['psnID'])
                        .filter( {name: 'psnID', op: '='} );

        var  cmd = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};
        
        soar.execute(cmd, query, function(err, data) {
            assert(!err, 'Failed to query');
            assert.equal( data.psnID, 1, 'Person ID not matched.');
            assert(!data.name, 'Name fields should have been removed.');
            done();
        });
    });

    it('Test fields with list', function(done) {
        var  expr = soar.sql('soar2.Person')
                        .column(['psnID'])
                        .filter( {name: 'psnID', op: '='} );

        var  cmd = {
                op: 'list',
                expr: expr
             };

        soar.execute(cmd, null, function(err, list) {
            assert(!err, 'Failed to list.');
            assert.equal( list.length, 3, 'Should have 3 records.');
            assert(!list[0].name, 'Name fields should have been removed.');
            done();
        });
    });
});
