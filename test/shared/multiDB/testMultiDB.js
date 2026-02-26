/*!
 * sql-soar
 * authors: Ben Lue
 * license: MIT License
 * Copyright(c) 2015 ~ 2018 Gocharm Inc.
 */
const  assert = require('assert'),
       path = require('path'),
       soar = require('../../lib/soar.js');

describe('Access multiple databases', function()  {

    before(function() {
        soar.config([
            {
                "dbConfig": {
                    "host"     : "127.0.0.1",
                    "database" : "soar",
                    "user"     : "your_acc",
                    "password" : "your_passwd",
                    "supportBigNumbers" : true,
                    "connectionLimit"   : 8
                }
            },
            {
                "dbConfig": {
                    "host"     : "127.0.0.1",
                    "database" : "soar2",
                    "user"     : "your_acc",
                    "password" : "your_passwd",
                    "supportBigNumbers" : true,
                    "connectionLimit"   : 8
                }
            }
        ]);
    });

    it('Simple query', async function() {
        var  expr = soar.sql('soar.Person')
                        .column(['psnID', 'name'])
                        .filter( {name: 'psnID', op: '='} );

        var  cmd = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        const  data = await soar.execute(cmd, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.name, 'John', 'Person name not matched.');

        expr = soar.sql('soar2.Person')
                   .filter( {name: 'psnID', op: '='} );
        cmd.expr = expr;

        const  data2 = await soar.execute(cmd, query);
        assert.equal( data2.name, 'Steve', 'name should be Steve');
    });

    it('List query', async function() {
        var  expr = soar.sql('soar.Person')
                        .filter( {name: 'psnID', op: '='} ),
             cmd = {
                 op: 'list',
                 expr: expr
             };
        const  list = await soar.execute(cmd, null);
        assert.equal( list.length, 5, 'Should have 5 persons.');

        expr = soar.sql('soar2.Person')
                   .filter( {name: 'psnID', op: '='} );
        cmd.expr = expr;

        const  list2 = await soar.execute(cmd, null);
        assert.equal( list2.length, 3, 'Should return 3 records.');
        assert.equal(list2[2].name, 'Jeremy', 'Person #3 is Jeremy.');
    });

    it('Update', async function() {
        var  expr = soar.sql('soar.Person')
                        .filter( {name: 'psnID', op: '='} ),
             cmd = {
                 op: 'update',
                 expr: expr
             },
             data = {name: 'John Mayer'};

        await soar.execute(cmd, data, {psnID: 1});

        cmd.op = 'query';
        const  result = await soar.execute(cmd, {psnID: 1});
        assert.equal( result.name, 'John Mayer', 'Person name not matched.');

        // restore data
        data = {name: 'John'};
        cmd.op = 'update';
        await soar.execute(cmd, data, {psnID: 1});
    });

    it('Insert and delete with transactions', async function() {
        const  conn = await soar.getConnection('soar');

        await conn.beginTransaction();

        var  data = {name: 'Scott Cooper'},
             expr = soar.sql('Person')
                        .filter( {name: 'psnID', op: '='} ),
             cmd = {
                 op: 'insert',
                 expr: expr,
                 conn: conn
             };

        const  psnPK = await soar.execute(cmd, data);
        assert(psnPK, 'Failed to insert');

        cmd.op = 'delete';
        await soar.execute(cmd, psnPK);

        await conn.commit();
        conn.release();
    });

    it('Test fields with query', async function() {
        var  expr = soar.sql('soar2.Person')
                        .column(['psnID'])
                        .filter( {name: 'psnID', op: '='} );

        var  cmd = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        const  data = await soar.execute(cmd, query);
        assert.equal( data.psnID, 1, 'Person ID not matched.');
        assert(!data.name, 'Name fields should have been removed.');
    });

    it('Test fields with list', async function() {
        var  expr = soar.sql('soar2.Person')
                        .column(['psnID'])
                        .filter( {name: 'psnID', op: '='} );

        var  cmd = {
                op: 'list',
                expr: expr
             };

        const  list = await soar.execute(cmd, null);
        assert.equal( list.length, 3, 'Should have 3 records.');
        assert(!list[0].name, 'Name fields should have been removed.');
    });
});
