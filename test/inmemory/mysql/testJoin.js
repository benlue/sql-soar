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


describe('Test table joins (MySQL in-memory)', function()  {

    it('Simple join', async function() {
    	var  expr = soar.sql('Person AS psn')
    					.join({table: 'PsnLoc AS pl', on: 'psn.psnID'})
						.join({table: 'GeoLoc AS geo', on: 'pl.geID'})
    					.column(['psn.psnID', 'psn.name', 'latitude', 'longitude'])
    					.filter({name: 'psn.psnID', op: '='}),
    		 cmd = {query: expr},
    		 query = {psnID: 1};

    	const data = await soar.execute(cmd, query);
    	assert.equal(data.name, 'John', 'wrong name');
    	assert.equal(data.latitude, 25.133398, 'wrong latitude');
    });

    it('Simple join -- short form', async function() {
    	var  expr = soar.sql('Person psn')
    					.join({table: 'PsnLoc pl', onWhat: 'psn.psnID = pl.psnID'})
    					.join({table: 'GeoLoc geo', onWhat: 'pl.geID=geo.geID'})
    					.column(['psn.psnID psnID', 'psn.name', 'latitude', 'longitude'])
    					.filter({name: 'psn.psnID', op: '='}),
    		 cmd = {
    		 	op: 'query',
    		 	expr: expr
    		 },
    		 query = {psnID: 1};

    	const data = await soar.execute(cmd, query);
    	assert.equal(data.name, 'John', 'wrong name');
    	assert.equal(data.latitude, 25.133398, 'wrong latitude');
    });

    it('join with auto fill', async function() {
        var  expr = soar.sql('Person AS psn')
                        .join({table: 'PsnLoc As pl', onWhat: 'psn.psnID=pl.psnID'})
                        .join({table: 'GeoLoc AS geo', onWhat: 'pl.geID=geo.geID'})
                        .column(['psn.name', 'geo.latitude']);

        var  cmd = {
                op: 'list',
                expr: expr
             };

        const list = await soar.execute(cmd);
        assert.equal(list.length, 2, '2 entries');
    });
});
