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
    soar.config();
});


describe('Test sql statement caching', function()  {
	
    it('Query statement', function(done) {
        var  expr = soar.sql('Person')
             			 .column(['psnID', 'name'])
                         .filter( {name: 'psnID', op: '='} );

        var  option = {
                op: 'query',
                expr: expr
             },
             query = {psnID: 1};

        soar.execute(option, query, function(err, data) {
            //console.log( JSON.stringify(expr.value(), null, 4) );
            assert( data, 'Missing psnID=1 data');
            assert.equal( data.name, 'John', 'Person name not matched.');
			
			//console.log('cached statement: ' + expr.value()._sql);
			// do it again
			soar.execute(option, query, function(err, data) {
	            assert( data, 'Missing psnID=1 data');
	            assert.equal( data.name, 'John', 'Person name not matched.');
	            done();
			});
        });
    });
    
    it('List -- pagination', function(done) {
        var  expr = soar.sql('Person');

        var  option = {
            op: 'list',
            expr: expr,
            range: soar.range(1, 2)
        };

        soar.execute(option, function(err, list, count) {
            //console.log( JSON.stringify(expr.value(), null, 4) );
            //console.log('result is\n%s', JSON.stringify(list, null, 4));
            //console.log('existing count is ' + expr.value()._count);
            assert.equal( count, 5, 'Totally 5 persons.');
            assert.equal( list.length, 2, 'page size is 2.');
            
            option.range = soar.range(2, 2);
            soar.execute(option, function(err, list, count) {
                //console.log( JSON.stringify(list, null, 4) );
                assert.equal( count, 5, 'Totally 5 persons.');
                assert.equal( list.length, 2, 'page size is 2.');
                done();
            });
        });
    });
    
    it('List -- pagination, force total count re-read', function(done) {
        var  expr = soar.sql('Person');

        var  option = {
            op: 'list',
            expr: expr,
            range: soar.range(1, 2),
            refresh: true
        };

        soar.execute(option, function(err, list, count) {
            //console.log( JSON.stringify(expr.value(), null, 4) );
            //console.log('existing count is ' + expr.value()._count);
            assert.equal( count, 5, 'Totally 5 persons.');
            assert.equal( list.length, 2, 'page size is 2.');
            
            option.range = soar.range(2, 2);
            soar.execute(option, function(err, list, count) {
                //console.log( JSON.stringify(list, null, 4) );
                assert.equal( count, 5, 'Totally 5 persons.');
                assert.equal( list.length, 2, 'page size is 2.');
                done();
            });
        });
    });
    
    it('List -- pagination, change query conditions to force re-read', function(done) {
        var  expr = soar.sql('Person')
                        .filter({name: 'addr', op: 'IS NULL'});

        var  option = {
            op: 'list',
            expr: expr,
            range: soar.range(1, 2),
            refresh: true
        };

        soar.execute(option, function(err, list, count) {
            //console.log( JSON.stringify(expr.value(), null, 4) );
            //console.log('existing count is ' + expr.value()._count);
            assert.equal( count, 5, 'Totally 5 persons.');
            assert.equal( list.length, 2, 'page size is 2.');
            
            var query = {addr: true};
            soar.execute(option, query, function(err, list, count) {
                //console.log('total count is ' + count);
                //console.log( JSON.stringify(list, null, 4) );
                assert.equal( count, 4, 'Totally 4 persons.');
                assert.equal( list.length, 2, 'page size is 2.');
                done();
            });
        });
    });
});