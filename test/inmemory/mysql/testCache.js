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


describe('Test sql statement caching (MySQL in-memory)', function()  {

    it('Query statement', async function() {
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

		// do it again
		const data2 = await soar.execute(option, query);
        assert( data2, 'Missing psnID=1 data');
        assert.equal( data2.name, 'John', 'Person name not matched.');
    });

    it('List -- pagination', async function() {
        let  expr = soar.sql('Person');

        let  cmd = {
            op: 'list',
            expr: expr,
            range: soar.range(1, 2)
        };

        const result1 = await soar.execute(cmd);
        assert.equal( result1.count, 5, 'Totally 5 persons.');
        assert.equal( result1.list.length, 2, 'page size is 2.');

        cmd.range = soar.range(2, 2);
        const result2 = await soar.execute(cmd);
        assert.equal( result2.count, 5, 'Totally 5 persons.');
        assert.equal( result2.list.length, 2, 'page size is 2.');
    });

    it('List -- pagination, force total count re-read', async function() {
        var  expr = soar.sql('Person');

        var  option = {
            op: 'list',
            expr: expr,
            range: soar.range(1, 2),
            refresh: true
        };

        const result1 = await soar.execute(option);
        assert.equal( result1.count, 5, 'Totally 5 persons.');
        assert.equal( result1.list.length, 2, 'page size is 2.');

        option.range = soar.range(2, 2);
        const result2 = await soar.execute(option);
        assert.equal( result2.count, 5, 'Totally 5 persons.');
        assert.equal( result2.list.length, 2, 'page size is 2.');
    });

    it('List -- pagination, change query conditions to force re-read', async function() {
        var  expr = soar.sql('Person')
                        .filter({name: 'addr', op: 'IS NULL'});

        var  option = {
            op: 'list',
            expr: expr,
            range: soar.range(1, 2),
            refresh: true
        };

        const result1 = await soar.execute(option);
        assert.equal( result1.count, 5, 'Totally 5 persons.');
        assert.equal( result1.list.length, 2, 'page size is 2.');

        var query = {addr: true};
        const result2 = await soar.execute(option, query);
        assert.equal( result2.count, 4, 'Totally 4 persons.');
        assert.equal( result2.list.length, 2, 'page size is 2.');
    });
});
