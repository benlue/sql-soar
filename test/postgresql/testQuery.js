/**
 * sql-soar postgreSQL test cases
 * @author Ben Lue
 * @copyright 2023 ~ 2025 Conwell Inc.
 */
const  assert = require('assert'),
       soar = require('../../lib/soar.js');


before(function() {
    soar.config({dbConfig: require('./config.json')})
})


describe('Test sql expression', function()  {

    it('Simple query', async function() {
        const  expr = soar.sql('Person')
                          .column(['psnID', 'name'])
                          .filter( {name: 'psnID', op: '='} );

        const  option = {
                            op: 'query',
                            expr: expr
                        },
               query = {psnID: 1};

        const  data = await soar.execute(option, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.name, 'John Doe', 'Person name not matched.');
    });

    it('Simple query, simple filter', async function() {
        const  expr = soar.sql('Person')
                          .column(['psnID', 'name'])
                          .filter( 'psnID' );

        const  option = {
                            op: 'query',
                            expr: expr
                        },
               query = {psnID: 1};

        const  data = await soar.execute(option, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.name, 'John Doe', 'Person name not matched.');
    });

    it('Simple query with alias', async function() {
        const  expr = soar.sql('Person')
                          .column(['psnID', 'name AS fullName'])
                          .filter( {name: 'psnID', op: '='} );

        const  option = {
                            op: 'query',
                            expr: expr
                        },
               query = {psnID: 1};

        const  data = await soar.execute(option, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.fullName, 'John Doe', 'Person name not matched.');
    });

    it('Query without specifying table columns', async function() {
        var  expr = soar.sql('Person')
                        .filter( {name: 'psnID', op: '='} );

        var  option = {query: expr},
             query = {psnID: 1};

        const  data = await soar.execute(option, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.name, 'John Doe', 'Person name not matched.');
    });

    it('Query without specifying table columns and query conditions', async function() {
        var  stemp = soar.sql('Person'),
             option = {query: stemp},
             query = {psnID: 1};

        const  data = await soar.execute(option, query);
        //console.log( JSON.stringify(data, null, 4) );
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.name, 'John Doe', 'Person name not matched.');
    });

    it('List all persons', async function() {
        var  option = {list: soar.sql('Person')};

        const  list = await soar.execute(option);
        //console.log( JSON.stringify(list, null, 4) );
        assert.equal( list.length, 13, 'Totally 5 persons.');
    });

    it('List with OR filter', async function() {
        var  expr = soar.sql('Person')
                        .filter( {
                            or: [
                                'name',
                                {age: '>='}
                            ]
                        });

        var  option = {
                op: 'list',
                expr: expr
             },
             query = {
                 name: 'Grace Lee',
                 age: 35
             };

        const  data = await soar.execute(option, query);
        assert.equal( data.length, 6, 'Should have 6 matches');
        //console.log( JSON.stringify(data, null, 4) );
    });

    it('List with the IN condition', async function() {
        const  expr = soar.sql('Person')
                        .filter({name: 'psnID', op: 'IN'});

        const  cmd = {
                        op: 'list',
                        expr: expr
                    };

        const  list = await soar.execute(cmd, {psnID: [1, 3]});
        //console.log( JSON.stringify(list, null, 4) );
        assert.equal( list.length, 2, 'Should return 2 persons.');
    });

    it('List -- pagination', async function() {
        const  cmd = {
                            list: soar.sql('Person'),
                            range: soar.range(1, 2)
                        };

        const  result = await soar.execute(cmd);
        //console.log( JSON.stringify(result.list, null, 4) );
        assert.equal( result.count, 13, 'Totally 13 persons.');
        assert.equal( result.list.length, 2, 'page size is 2.');
    });

    it('Update', async function() {
        const  expr = soar.sql('Person')
                          .column(['psnID', 'name'])
                          .filter( {name: 'psnID', op: '='} );

        const  option = {update: expr},
               data = {name: 'John Mayer'},
               query = {psnID: 1};

        await soar.execute(option, data, query);

        delete  option.update;
        option.query = expr;
        const  result = await soar.execute(option, query);
        assert.equal( result.name, 'John Mayer', 'Person name not matched.');

        // restore data
        delete  option.query;
        option.update = expr;
        await soar.execute(option, {name: 'John Doe'}, query);
    });

    it('Update without specifying table columns', async function() {
        const  expr = soar.sql('Person')
                          .filter( {name: 'psnID', op: '='} );

        const  option = {
                            op: 'update',
                            expr: expr
                        },
               data = {name: 'John Mayer'},
               query = {psnID: 1};

        await soar.execute(option, data, query);

        option.op = 'query';
        const  result = await soar.execute(option, query);
        assert.equal( result.name, 'John Mayer', 'Person name not matched.');

        // restore data
        option.op = 'update';
        await soar.execute(option, {name: 'John Doe'}, query);
    });

    it('Update without specifying table columns and query conditions', async function() {
        var  expr = soar.sql('Person'),
             cmd = {
                op: 'update',
                expr: expr
             },
             now = new Date(),
             data = {name: 'John Mayer', modifyTime: now},
             query = {psnID: 1};

        await soar.execute(cmd, data, query);

        cmd.op = 'query';
        const  result = await soar.execute(cmd, query);
        assert.equal( result.name, 'John Mayer', 'Person name not matched.');

        // restore data
        cmd.op = 'update';
        await soar.execute(cmd, {name: 'John Doe'}, query);
    });

    it('Insert and delete with transactions', async function() {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name'])
                        .filter( {name: 'psnID', op: '='} );

        const  conn = await soar.getConnection();
        try {
            await conn.beginTransaction();

            var  option = {
                    insert: expr,
                    conn: conn
                 },
                 data = {name: 'Scott Cooper'};

            const  value = await soar.execute(option, data);
            assert(value, 'Failed to insert');

            delete option.insert;
            option.delete = expr;
            await soar.execute(option, value);

            await conn.commit();
        }
        catch (e)  {
            await conn.rollback();
            throw e;
        }
        finally  {
            conn.release();
        }
    });

    it('Insert and delete without specifying table columns', async function() {
        var  expr = soar.sql('Person')
                        .filter( {name: 'psnID', op: '='} );

        const  conn = await soar.getConnection();
        try {
            await conn.beginTransaction();

            var  option = {
                    op: 'insert',
                    expr: expr,
                    conn: conn
                 },
                 data = {name: 'Scott Cooper', dob: new Date()};

            const  value = await soar.execute(option, data);
            assert(value, 'Failed to insert');

            option.op = 'delete';
            await soar.execute(option, value);

            await conn.commit();
        }
        catch (e)  {
            await conn.rollback();
            throw e;
        }
        finally  {
            conn.release();
        }
    });

    it('Use join expression to do insert & delete', async function() {
    	var  expr = soar.sql('Person AS psn')
    					.join({table: 'PsnLoc AS pl', onWhat: 'psn.psnID = pl.psnID'})
    					.join({table: 'GeoLoc AS geo', onWhat: 'pl.geID=geo.geID'})
    					.column(['psn.psnID', 'psn.name', 'latitude', 'longitude'])
    					.filter({name: 'psn.psnID', op: '='});

        const  conn = await soar.getConnection();
        try {
            await conn.beginTransaction();

            var  cmd = {
                    op: 'insert',
                    expr: expr,
                    conn: conn
                 },
                 data = {name: 'Scott Cooper'};

            const  value = await soar.execute(cmd, data);
            //console.log('inserted key is\n%s', JSON.stringify(value));
            assert(value, 'Failed to insert');

            cmd.op = 'delete';
            await soar.execute(cmd, value);

            await conn.commit();
        }
        catch (e)  {
            await conn.rollback();
            throw e;
        }
        finally  {
            conn.release();
        }
    });

    it('Use join expression to do update', async function() {
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

        await soar.execute(option, data, query);

        option.op = 'query';
        const  result = await soar.execute(option, query);
        assert.equal( result.name, 'John Mayer', 'Person name not matched.');

        // restore data
        option.op = 'update';
        await soar.execute(option, {name: 'John Doe'}, query);
    });

    it('Run SQL directly', async function() {
        const  sql = 'SELECT COUNT(*) count FROM "Person" WHERE "name" LIKE $1',
               p = ['Frank%'];

        const  result = await soar.runSql(sql, p);
        //    console.log(JSON.stringify(result, null, 4));
        assert.equal(result[0].count, 1, 'one match');
    });
});

describe('Test short hand', function()  {

    it('simple query', async function() {
        const  data = await soar.query('Person', {name: 'Jane Smith'});
        assert.equal(data.psnID, 2, 'id is 2');
    });

    it('query', async function() {
        var  sql = soar.sql('Person');
        const  data = await soar.query(sql, {name: 'Jane Smith'});
        assert.equal(data.psnID, 2, 'id is 2');
    });

    it('list', async function() {
        const  list = await soar.list('Person', {psnID: {op: '>=', value: 2}});
        assert.equal(list.length, 12, '12 matches');
    });

    it('list -- compound query', async function() {
        var  query = {
                psnID: {op: '>=', value: 2},
                name: 'John Doe'
             };
        const  list = await soar.list('Person', query);
        assert.equal(list.length, 0, 'no match.');
    });

    it('list -- IS NULL', async function() {
        var  query = {
                addr: {op: 'IS NULL', value: true}
             };
        const  list = await soar.list('Person', query);
        assert.equal(list.length, 0, '0 matches.');
    });

    it('update', async function() {
        var  updData = {
                        name: 'David Black',
                        addr: 'San Fransisco'
                    };
        await soar.update('Person', updData, {psnID: 2});
        //console.log( JSON.stringify(data, null, 4) );

        const  data = await soar.query('Person', {psnID: 2});
        assert.equal(data.name, 'David Black', 'full name changed to David Black');
        assert.equal(data.addr, 'San Fransisco', 'address is San Fransisco');

        updData.name = 'Jane Smith';
        updData.addr = '456 Oak Ave';
        await soar.update('Person', updData, {psnID: 2});
    });

    it('create & delete', async function() {
        const  pk = await soar.insert('Person', {name: 'Millman'});
        //console.log( JSON.stringify(pk, null, 4) );

        await soar.del('Person', pk);
    });
});
