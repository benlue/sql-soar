/*!
* sql-soar
* authors: Ben Lue
* license: MIT License
* Copyright(c) 2015 ~ 2018 Gocharm Inc.
*/
const  assert = require('assert'),
       path = require('path'),
       soar = require('../lib/soar.js');

describe('Test sql expression', function()  {

    before(function() {
        soar.config();
    });

    it('Simple query', function(done) {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name'])
                        .filter( {name: 'psnID', op: '='} );

        var  option = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        soar.execute(option, query, function(err, data) {
            assert( data, 'Missing psnID=1 data');
            assert.equal( data.name, 'John', 'Person name not matched.');
            done();
        });
    });

    it('Simple query, simple filter', function(done) {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name'])
                        .filter( 'psnID' );

        var  option = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        soar.execute(option, query, function(err, data) {
            assert( data, 'Missing psnID=1 data');
            assert.equal( data.name, 'John', 'Person name not matched.');
            done();
        });
    });

    it('Simple query with alias', function(done) {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name AS fullName'])
                        .filter( {name: 'psnID', op: '='} );

        var  option = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        soar.execute(option, query, function(err, data) {
            assert( data, 'Missing psnID=1 data');
            assert.equal( data.fullName, 'John', 'Person name not matched.');
            done();
        });
    });

    it('Query without specifying table columns', function(done) {
        var  expr = soar.sql('Person')
                        .filter( {name: 'psnID', op: '='} );

        var  option = {query: expr},
             query = {psnID: 1};

        soar.execute(option, query, function(err, data) {
            assert( data, 'Missing psnID=1 data');
            assert.equal( data.name, 'John', 'Person name not matched.');
            done();
        });
    });

    it('Query without specifying table columns and query conditions', function(done) {
        var  stemp = soar.sql('Person'),
             option = {query: stemp},
             query = {psnID: 1};

        soar.execute(option, query, function(err, data) {
            //console.log( JSON.stringify(data, null, 4) );
            assert( data, 'Missing psnID=1 data');
            assert.equal( data.name, 'John', 'Person name not matched.');
            done();
        });
    });

    it('List all persons', function(done) {
        var  option = {list: soar.sql('Person')};

        soar.execute(option, function(err, list) {
            //console.log( JSON.stringify(list, null, 4) );
            assert.equal( list.length, 5, 'Totally 5 persons.');
            done();
        });
    });

    it('List with OR filter', function(done) {
        var  expr = soar.sql('Person')
                        .filter( {
                            or: [
                                'name',
                                {dob: '>='}
                            ]
                        });

        var  option = {
                op: 'list',
                expr: expr
             },
             query = {
                 name: 'Stacy',
                 dob: '1980-01-01'
             };

        soar.execute(option, query, function(err, data) {
            assert.equal( data.length, 3, 'Should have 3 matches');
            //console.log( JSON.stringify(data, null, 4) );
            done();
        });
    });

    it('List with the IN condition', function(done) {
        var  expr = soar.sql('Person')
                        .filter({name: 'psnID', op: 'IN'});

        var  cmd = {
            op: 'list',
            expr: expr
        };

        soar.execute(cmd, {psnID: [1, 3]}, function(err, list) {
            //console.log( JSON.stringify(list, null, 4) );
            assert.equal( list.length, 2, 'Should return 2 persons.');
            done();
        });
    });

    it('List -- pagination', function(done) {
        var  option = {
                list: soar.sql('Person'),
                range: soar.range(1, 2)
             };

        soar.execute(option, function(err, list, count) {
            //console.log( JSON.stringify(list, null, 4) );
            assert.equal( count, 5, 'Totally 5 persons.');
            assert.equal( list.length, 2, 'page size is 2.');
            done();
        });
    });

    it('Update', function(done) {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name'])
                        .filter( {name: 'psnID', op: '='} );

        var  option = {update: expr},
             data = {name: 'John Mayer'},
             query = {psnID: 1};

        soar.execute(option, data, query, function(err) {
            assert(!err, 'Failed to do update.');

            delete  option.update;
            option.query = expr;
            soar.execute(option, query, function(err, data) {
                assert.equal( data.name, 'John Mayer', 'Person name not matched.');

                // restore data
                delete  option.query;
                option.update = expr;
                soar.execute(option, {name: 'John'}, query, function(err) {
                    assert(!err, 'Failed to do update.');
                    done();
                });
            });
        })
    });

    it('Update without specifying table columns', function(done) {
        var  expr = soar.sql('Person')
                        .filter( {name: 'psnID', op: '='} );

        var  option = {
                op: 'update',
                expr: expr
             },
             data = {name: 'John Mayer'},
             query = {psnID: 1};

        soar.execute(option, data, query, function(err) {
            assert(!err, 'Failed to do update.');

            option.op = 'query';
            soar.execute(option, query, function(err, data) {
                assert.equal( data.name, 'John Mayer', 'Person name not matched.');

                // restore data
                option.op = 'update';
                soar.execute(option, {name: 'John'}, query, function(err) {
                    assert(!err, 'Failed to do update.');
                    done();
                });
            });
        });
    });

    it('Update without specifying table columns and query conditions', function(done) {
        var  expr = soar.sql('Person'),
             cmd = {
                op: 'update',
                expr: expr
             },
             now = new Date(),
             data = {name: 'John Mayer', modifyTime: now},
             query = {psnID: 1};

        soar.execute(cmd, data, query, function(err) {
            assert(!err, 'Failed to do update.');

            cmd.op = 'query';
            soar.execute(cmd, query, function(err, data) {
                var  mdTime = data.modifyTime;
                //console.log('written time: %d, readback time: %d', now.getSeconds(), mdTime.getSeconds());
                assert.equal( data.name, 'John Mayer', 'Person name not matched.');
                assert.equal( now.getMinutes(), mdTime.getMinutes(), 'modify time does not match');

                // restore data
                cmd.op = 'update';
                soar.execute(cmd, {name: 'John'}, query, function(err) {
                    assert(!err, 'Failed to do update.');
                    done();
                });
            });
        })
    });
    
    it('Insert and delete with transactions', function(done) {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name'])
                        .filter( {name: 'psnID', op: '='} );

        soar.getConnection( function(err, conn) {
            conn.beginTransaction(function(err) {
                assert(!err, 'Transaction failed to get started.');

                var  option = {
                        insert: expr,
                        conn: conn
                     },
                     data = {name: 'Scott Cooper'};

                soar.execute(option, data, function(err, value) {
                    assert(value, 'Failed to insert');

                    delete option.insert;
                    option.delete = expr;
                    soar.execute(option, value, function(err) {
                        assert(!err, 'Failed to delete.');
                        conn.commit( function(err) {
                            assert(!err, 'Transaction failed to commit.');
                            conn.release();
                            done();
                        });
                    });
                })
            });
        });
    });
    
    it('Insert and delete without specifying table columns', function(done) {
        var  expr = soar.sql('Person')
                        .filter( {name: 'psnID', op: '='} );

        soar.getConnection( function(err, conn) {
            conn.beginTransaction(function(err) {
                assert(!err, 'Transaction failed to get started.');

                var  option = {
                        op: 'insert',
                        expr: expr,
                        conn: conn
                     },
                     data = {name: 'Scott Cooper', dob: new Date()};

                soar.execute(option, data, null, function(err, value) {
                    assert(value, 'Failed to insert');

                    option.op = 'delete';
                    soar.execute(option, value, function(err) {
                        assert(!err, 'Failed to delete.');
                        conn.commit( function(err) {
                            assert(!err, 'Transaction failed to commit.');

                            conn.release();
                            done();
                        });
                    });
                })
            });
        });
    });
    
    it('Use join expression to do insert & delete', function(done) {
    	var  expr = soar.sql('Person AS psn')
    					.join({table: 'PsnLoc AS pl', onWhat: 'psn.psnID = pl.psnID'})
    					.join({table: 'GeoLoc AS geo', onWhat: 'pl.geID=geo.geID'})
    					.column(['psn.psnID', 'psn.name', 'latitude', 'longitude'])
    					.filter({name: 'psn.psnID', op: '='});

    	soar.getConnection( function(err, conn) {
            conn.beginTransaction(function(err) {
                assert(!err, 'Transaction failed to get started.');

                var  cmd = {
                        op: 'insert',
                        expr: expr,
                        conn: conn
                     },
                     data = {name: 'Scott Cooper'};

                soar.execute(cmd, data, null, function(err, value) {
                    //console.log('inserted key is\n%s', JSON.stringify(value));
                    assert(value, 'Failed to insert');

                    cmd.op = 'delete';
                    soar.execute(cmd, value, function(err) {
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

    it('Use join expression to do update', function(done) {
    	var  expr = soar.sql('Person AS psn')
    					.join({table: 'PsnLoc AS pl', onWhat: 'psn.psnID = pl.psnID'})
    					.join({table: 'GeoLoc AS geo', onWhat: 'pl.geID=geo.geID'})
    					.column(['psn.psnID', 'psn.name', 'latitude', 'longitude'])
    					.filter({name: 'psn.psnID', op: '='});

    	var  option = {
                op: 'update',
                expr: expr
             },
             data = {name: 'John Mayer'},
             query = {psnID: 1};

        soar.execute(option, data, query, function(err) {
            if (err)
                console.log( err.stack );
            assert(!err, 'Failed to do update.');

            option.op = 'query';
            soar.execute(option, query, function(err, data) {
                assert.equal( data.name, 'John Mayer', 'Person name not matched.');

                // restore data
                option.op = 'update';
                soar.execute(option, {name: 'John'}, query, function(err) {
                    assert(!err, 'Failed to do update.');
                    done();
                });
            });
        });
    });

    it('Run SQL directly', function(done) {
        var  sql = "SELECT COUNT(*) count FROM Person WHERE name LIKE ?",
             p = ['David%'];
             
        soar.runSql(sql, p, function(err, result) {
           //console.log(JSON.stringify(result, null, 4));
           assert.equal(result[0].count, 1, 'one match');
           done(); 
        });
    });
});

describe('Test short hand', function()  {
    
    it('simple query', function(done) {
        soar.query('Person', {name: 'David'}, function(err, data) {
            assert.equal(data.psnID, 2, 'id is 2');
            done();
        });
    });
    
    it('query', function(done) {
        var  sql = soar.sql('Person');
        soar.query(sql, {name: 'David'}, function(err, data) {
            assert.equal(data.psnID, 2, 'id is 2');
            done();
        });
    });
    
    it('list', function(done) {
        soar.list('Person', {psnID: {op: '>=', value: 2}}, function(err, list) {
            assert.equal(list.length, 4, '4 matches');
            done();
        });
    });
    
    it('list -- compound query', function(done) {
        var  query = {
                psnID: {op: '>=', value: 2},
                name: 'John'
             };
        soar.list('Person', query, function(err, list) {
            assert.equal(list.length, 0, 'no match.');
            done();
        });
    });
    
    it('list -- IS NULL', function(done) {
        var  query = {
                addr: {op: 'IS NULL', value: true}
             };
        soar.list('Person', query, function(err, list) {
            assert.equal(list.length, 4, '4 matches.');
            done();
        });
    });
    
    it('update', function(done) {
        var  updData = {
            name: 'David Black',
            addr: 'San Fransisco'
        };
        soar.update('Person', updData, {psnID: 2}, function(err, data) {
            //console.log( JSON.stringify(data, null, 4) );
            
            soar.query('Person', {psnID: 2}, function(err, data) {
                assert.equal(data.name, 'David Black', 'full name changed to David Black');
                assert.equal(data.addr, 'San Fransisco', 'address is San Fransisco');
                
                updData.name = 'David';
                updData.addr = 'Oakland';
                soar.update('Person', updData, {psnID: 2}, function(err, data) {
                    done();
                });
            });
        });
    });
    
    it('create & delete', function(done) {
        soar.insert('Person', {name: 'Millman'}, function(err, pk) {
            //console.log( JSON.stringify(pk, null, 4) );
            
            soar.del('Person', pk, function(err) {
                assert(!err, 'fail to delete');
                done();
            });
        });
    });
});