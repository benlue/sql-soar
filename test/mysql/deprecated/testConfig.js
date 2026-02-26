/**
 * sql-soar mySQL test cases
 * @author Ben Lue
 * @copyright 2023 ~ 2025 Conwell Inc.
 */
const  assert = require('assert'),
       soar = require('../../../lib/soar.js');

const  dbUser = 'your_acc',
       rightPasswd = 'your_passwd',
       wrongPasswd = 'xxxx';


describe('Test configuration and settings', function()  {

    it('Reading DB with alias set in the default configurations', function(done) {
        soar.config();
        
        let  cmd = {list: soar.sql('soar2.Person')};
             
        soar.execute(cmd, function(err, list) {
            //console.log( JSON.stringify(list, null, 4) );
            assert.ifError( err );
            assert.equal(list.length, 3, 'We have 3 samples.');
            done();
        });
    });

    it('Setting wrong DB configurations', function(done) {
        let  options = {
                dbConfig: {
                    "host"     : "127.0.0.1",
                    "database" : "soar",
                    "user"     : dbUser,
                    "password" : wrongPasswd,
                    "supportBigNumbers" : true,
                    "connectionLimit"   : 4
                }
             };
        soar.config( options );
        
        let  cmd = {
                op: 'list',
                expr: soar.sql('Person')
             };
             
        soar.execute(cmd, function(err, list) {
            assert(err, 'Should throw exception here.');
            done();
        });
    });

    it('Setting correct DB configurations', function(done) {
        let  options = {
                dbConfig: {
                    "host"     : "127.0.0.1",
                    "database" : "soar",
                    "user"     : dbUser,
                    "password" : rightPasswd,
                    "supportBigNumbers" : true,
                    "connectionLimit"   : 4
                }
             };
        soar.config( options );
        
        let  cmd = {list: soar.sql('Person')};
             
        soar.execute(cmd, function(err, list) {
            assert.ifError( err );
            assert.equal(list.length, 5, 'We have 5 samples.');
            done();
        });
    });
});
