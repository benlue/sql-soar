/*!
* sql-soar
* authors: Ben Lue
* license: MIT License
* Copyright(c) 2015~2018 Gocharm Inc.
*/
const  assert = require('assert'),
       path = require('path'),
       soar = require('../lib/soar.js');


describe('Test stored SQL expressions', function()  {

    before(function() {
        soar.config();
    });

    it('Query with /person', function(done) {
        var  option = {
                op: 'query',
                expr: '/person'
             },
             query = {psnID: 1};

        soar.execute(option, query, function(err, data) {
            assert( data, 'Missing psnID=1 data');
            assert.equal( data.name, 'John', 'Person name not matched.');
            done();
        });
    });

    it('List with /person/personAddr', function(done) {
        var  option = {
                op: 'list',
                expr: '/person/personAddr'
             },
             query = {dob: '1980-01-01'};

        soar.execute(option, query, function(err, data) {
            assert.equal( data.length, 1, 'One matched data');
            assert.equal( data[0].name, 'John', 'Person name not matched.');
            assert.equal( data[0].addr, 'Unknown', 'addr is unknown.');
            assert.equal( data[0].address, 'Unknown', 'Address is unknown.');
            done();
        });
    });
});