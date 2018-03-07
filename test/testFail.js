/*!
 * sql-soar
 * authors: Ben Lue
 * license: MIT License
 * Copyright(c) 2015 ~ 2018 Gocharm Inc.
*/
const  assert = require('assert'),
       path = require('path'),
       soar = require('../lib/soar.js');


describe('Test errors', function()  {

    before(function() {
        soar.config();
    });

    it('Wrong command', function(done) {
        var  cmd = {
                op: "query"
             };
             
        soar.execute(cmd, {col: 123}, function(err)  {
           assert(err.stack, 'an error should be thrown.');
           done(); 
        });
	});
	
    it('sql template', function(done) {
       var  sqls = soar.sql('myTable');
       
       try  {
           sqls.join({});
       } 
       catch (err)  {
           assert(err.stack, 'should throw an error.');
           done();
       }
    });
    
    it('schema management', function(done) {
        try  {
           soar.renameTable('name', function(err) {
           });
       } 
       catch (err)  {
           assert(err.stack, 'should throw an error.');
           done();
       }
    });
});