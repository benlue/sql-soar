/*!
 * sql-soar
 * authors: Ben Lue
 * license: MIT License
 * Copyright(c) 2015 Gocharm Inc.
 */
const  assert = require('assert'),
       path = require('path'),
       soar = require('../lib/soar.js');


describe('Test table joins', function()  {

	before(function() {
		soar.config();
	});

    it('Simple join', function(done) {
    	var  expr = soar.sql('Person AS psn')
    					.join({table: 'PsnLoc AS pl', on: 'psn.psnID'})
						.join({table: 'GeoLoc AS geo', on: 'pl.geID'})
    					.column(['psn.psnID', 'psn.name', 'latitude', 'longitude'])
    					.filter({name: 'psn.psnID', op: '='}),
    		 cmd = {query: expr},
    		 query = {psnID: 1};

    	soar.execute(cmd, query, function(err, data) {
    		//console.log(JSON.stringify(data, null, 4));
    		assert.equal(data.name, 'John', 'wrong name');
    		assert.equal(data.latitude, 25.133398, 'wrong latitude');

    		done();
    	})
    });
    
    it('Simple join -- short form', function(done) {
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

    	soar.execute(cmd, query, function(err, data) {
    		//console.log(JSON.stringify(data, null, 4));
    		assert.equal(data.name, 'John', 'wrong name');
    		assert.equal(data.latitude, 25.133398, 'wrong latitude');

    		done();
    	})
    });

    it('join with auto fill', function(done) {
        var  expr = soar.sql('Person AS psn')
                        .join({table: 'PsnLoc As pl', onWhat: 'psn.psnID=pl.psnID'})
                        .join({table: 'GeoLoc AS geo', onWhat: 'pl.geID=geo.geID'})
                        .column(['psn.name', 'geo.latitude']);

        var  cmd = {
                op: 'list',
                expr: expr
             };

        soar.execute(cmd, function(err, list) {
            //console.log( JSON.stringify(list, null, 4) );
            assert.equal(list.length, 2, '2 entries');
            done();
        });
    });
});