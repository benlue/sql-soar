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


describe('Test errors (MySQL in-memory)', function()  {

    it('Wrong command', async function() {
        var  cmd = {
                op: "query"
             };

        try {
            await soar.execute(cmd, {col: 123});
            assert.fail('Should have thrown an error');
        } catch (err) {
            assert(err.stack, 'an error should be thrown.');
        }
	});

    it('sql template', function() {
       var  sqls = soar.sql('myTable');

       try  {
           sqls.join({});
       }
       catch (err)  {
           assert(err.stack, 'should throw an error.');
       }
    });

    it('schema management', async function() {
        try  {
           await soar.renameTable('name');
           assert.fail('Should have thrown an error');
       }
       catch (err)  {
           assert(err.stack, 'should throw an error.');
       }
    });
});
