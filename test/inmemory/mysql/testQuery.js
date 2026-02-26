/**
 * sql-soar MySQL in-memory test cases (mysql-memory-server)
 * @author Ben Lue
 * @copyright 2025 ~ 2026 Conwell Inc.
 */
const  assert = require('assert'),
       soar = require('../../../lib/soar.js');
const  { createInMemoryMysqlConfig } = require('../../helpers/mysqlMemorySetup');


before(async function() {
    this.timeout(60000);
    const  { config } = await createInMemoryMysqlConfig();
    soar.config(config);
})


describe('Test sql expression (MySQL in-memory)', function()  {

    it('Simple query', async function() {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name'])
                        .filter( {name: 'psnID', op: '='} );

        var  option = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        const data = await soar.execute(option, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.name, 'John', 'Person name not matched.');
    });

    it('Simple query, simple filter', async function() {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name'])
                        .filter( 'psnID' );

        var  option = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        const data = await soar.execute(option, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.name, 'John', 'Person name not matched.');
    });

    it('Simple query with alias', async function() {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name AS fullName'])
                        .filter( {name: 'psnID', op: '='} );

        var  option = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        const data = await soar.execute(option, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.fullName, 'John', 'Person name not matched.');
    });

    it('Query without specifying table columns', async function() {
        var  expr = soar.sql('Person')
                        .filter( {name: 'psnID', op: '='} );

        var  option = {query: expr},
             query = {psnID: 1};

        const data = await soar.execute(option, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.name, 'John', 'Person name not matched.');
    });

    it('Query without specifying table columns and query conditions', async function() {
        var  stemp = soar.sql('Person'),
             option = {query: stemp},
             query = {psnID: 1};

        const data = await soar.execute(option, query);
        assert( data, 'Missing psnID=1 data');
        assert.equal( data.name, 'John', 'Person name not matched.');
    });

    it('List all persons', async function() {
        var  option = {list: soar.sql('Person')};

        const list = await soar.execute(option);
        assert.equal( list.length, 5, 'Totally 5 persons.');
    });

    it('List with OR filter', async function() {
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

        const data = await soar.execute(option, query);
        assert.equal( data.length, 3, 'Should have 3 matches');
    });

    it('List with the IN condition', async function() {
        var  expr = soar.sql('Person')
                        .filter({name: 'psnID', op: 'IN'});

        var  cmd = {
            op: 'list',
            expr: expr
        };

        const list = await soar.execute(cmd, {psnID: [1, 3]});
        assert.equal( list.length, 2, 'Should return 2 persons.');
    });

    it('List -- pagination', async function() {
        var  option = {
                list: soar.sql('Person'),
                range: soar.range(1, 2)
             };

        const result = await soar.execute(option);
        assert.equal( result.count, 5, 'Totally 5 persons.');
        assert.equal( result.list.length, 2, 'page size is 2.');
    });

    it('Update', async function() {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name'])
                        .filter( {name: 'psnID', op: '='} );

        var  option = {update: expr},
             data = {name: 'John Mayer'},
             query = {psnID: 1};

        await soar.execute(option, data, query);

        delete  option.update;
        option.query = expr;
        const result = await soar.execute(option, query);
        assert.equal( result.name, 'John Mayer', 'Person name not matched.');

        // restore data
        delete  option.query;
        option.update = expr;
        await soar.execute(option, {name: 'John'}, query);
    });

    it('Update without specifying table columns', async function() {
        var  expr = soar.sql('Person')
                        .filter( {name: 'psnID', op: '='} );

        var  option = {
                op: 'update',
                expr: expr
             },
             data = {name: 'John Mayer'},
             query = {psnID: 1};

        await soar.execute(option, data, query);

        option.op = 'query';
        const result = await soar.execute(option, query);
        assert.equal( result.name, 'John Mayer', 'Person name not matched.');

        // restore data
        option.op = 'update';
        await soar.execute(option, {name: 'John'}, query);
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
        const result = await soar.execute(cmd, query);
        var  mdTime = result.modifyTime;
        assert.equal( result.name, 'John Mayer', 'Person name not matched.');
        assert.equal( now.getMinutes(), mdTime.getMinutes(), 'modify time does not match');

        // restore data
        cmd.op = 'update';
        await soar.execute(cmd, {name: 'John'}, query);
    });

    it('Insert and delete with transactions', async function() {
        var  expr = soar.sql('Person')
                        .column(['psnID', 'name'])
                        .filter( {name: 'psnID', op: '='} );

        const conn = await soar.getConnection();
        await conn.beginTransaction();

        var  option = {
                insert: expr,
                conn: conn
             },
             data = {name: 'Scott Cooper'};

        const value = await soar.execute(option, data);
        assert(value, 'Failed to insert');

        delete option.insert;
        option.delete = expr;
        await soar.execute(option, value);

        await conn.commit();
        conn.release();
    });

    it('Insert and delete without specifying table columns', async function() {
        var  expr = soar.sql('Person')
                        .filter( {name: 'psnID', op: '='} );

        const conn = await soar.getConnection();
        await conn.beginTransaction();

        var  option = {
                op: 'insert',
                expr: expr,
                conn: conn
             },
             data = {name: 'Scott Cooper', dob: new Date()};

        const value = await soar.execute(option, data, null);
        assert(value, 'Failed to insert');

        option.op = 'delete';
        await soar.execute(option, value);

        await conn.commit();
        conn.release();
    });

    it('Use join expression to do insert & delete', async function() {
    	var  expr = soar.sql('Person AS psn')
    					.join({table: 'PsnLoc AS pl', onWhat: 'psn.psnID = pl.psnID'})
    					.join({table: 'GeoLoc AS geo', onWhat: 'pl.geID=geo.geID'})
    					.column(['psn.psnID', 'psn.name', 'latitude', 'longitude'])
    					.filter({name: 'psn.psnID', op: '='});

    	const conn = await soar.getConnection();
        await conn.beginTransaction();

        var  cmd = {
                op: 'insert',
                expr: expr,
                conn: conn
             },
             data = {name: 'Scott Cooper'};

        const value = await soar.execute(cmd, data, null);
        assert(value, 'Failed to insert');

        cmd.op = 'delete';
        await soar.execute(cmd, value);

        await conn.commit();
        conn.release();
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
        const result = await soar.execute(option, query);
        assert.equal( result.name, 'John Mayer', 'Person name not matched.');

        // restore data
        option.op = 'update';
        await soar.execute(option, {name: 'John'}, query);
    });

    it('Run SQL directly', async function() {
        var  sql = "SELECT COUNT(*) count FROM Person WHERE name LIKE ?",
             p = ['David%'];

        const result = await soar.runSql(sql, p);
        assert.equal(result[0].count, 1, 'one match');
    });
});

describe('Test short hand (MySQL in-memory)', function()  {

    it('simple query', async function() {
        const data = await soar.query('Person', {name: 'David'});
        assert.equal(data.psnID, 2, 'id is 2');
    });

    it('query', async function() {
        var  sql = soar.sql('Person');
        const data = await soar.query(sql, {name: 'David'});
        assert.equal(data.psnID, 2, 'id is 2');
    });

    it('list', async function() {
        const list = await soar.list('Person', {psnID: {op: '>=', value: 2}});
        assert.equal(list.length, 4, '4 matches');
    });

    it('list -- compound query', async function() {
        var  query = {
                psnID: {op: '>=', value: 2},
                name: 'John'
             };
        const list = await soar.list('Person', query);
        assert.equal(list.length, 0, 'no match.');
    });

    it('list -- IS NULL', async function() {
        var  query = {
                addr: {op: 'IS NULL', value: true}
             };
        const list = await soar.list('Person', query);
        assert.equal(list.length, 4, '4 matches.');
    });

    it('update', async function() {
        var  updData = {
            name: 'David Black',
            addr: 'San Fransisco'
        };
        await soar.update('Person', updData, {psnID: 2});

        const data = await soar.query('Person', {psnID: 2});
        assert.equal(data.name, 'David Black', 'full name changed to David Black');
        assert.equal(data.addr, 'San Fransisco', 'address is San Fransisco');

        updData.name = 'David';
        updData.addr = 'Oakland';
        await soar.update('Person', updData, {psnID: 2});
    });

    it('create & delete', async function() {
        const pk = await soar.insert('Person', {name: 'Millman'});

        await soar.del('Person', pk);
    });
});
