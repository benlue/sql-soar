/**
 * sql-soar mySQL test cases
 * @author Ben Lue
 * @copyright 2023 ~ 2025 Conwell Inc.
 */
const  assert = require('assert'),
       soar = require('../../lib/soar.js');

before(function() {
    soar.config({"dbConfig": require('./config.json')})
})


describe('Test errors', function()  {

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