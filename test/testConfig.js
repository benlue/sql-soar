/*!
* sql-soar
* authors: Ben Lue
* license: MIT License
* Copyright(c) 2015 Gocharm Inc.
*/
var  assert = require('assert'),
     dbConn = require('../lib/dbConn.js'),
     path = require('path'),
     soar = require('../lib/soar.js');

var  dbUser = 'my_acc',
     rightPasswd = 'my_passwd',
     wrongPasswd = 'xxxx';

//soar.setDebug( true );

describe('Test configuration and settings', function()  {

    it('Reading default configurations', function(done) {
        soar.config();
        
        var  cmd = {
                op: 'list',
                expr: soar.sql('Person')
             };
             
        soar.execute(cmd, function(err, list) {
            assert.ifError( err );
            assert.equal(list.length, 5, 'We have 5 samples.');
            done();
        });
    });

    it('Setting wrong DB configurations', function(done) {
        var  options = {
            dbConfig: {
                "host"     : "127.0.0.1",
                "database" : "soar",
                "user"     : dbUser,
                "password" : wrongPasswd,
                "supportBigNumbers" : true,
                "connectionLimit"   : 32
            }
        };
        soar.config( options );
        
        var  cmd = {
                op: 'list',
                expr: soar.sql('Person')
             };
             
        soar.execute(cmd, function(err, list) {
            assert(err, 'Should throw exception here.');
            done();
        });
    });

    it('Setting correct DB configurations', function(done) {
        var  options = {
            dbConfig: {
                "host"     : "127.0.0.1",
                "database" : "soar",
                "user"     : dbUser,
                "password" : rightPasswd,
                "supportBigNumbers" : true,
                "connectionLimit"   : 32
            }
        };
        soar.config( options );
        
        var  cmd = {
                op: 'list',
                expr: soar.sql('Person')
             };
             
        soar.execute(cmd, function(err, list) {
            assert.ifError( err );
            assert.equal(list.length, 5, 'We have 5 samples.');
            done();
        });
    });
});
