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


describe('Test query objects (MySQL in-memory)', function()  {

    it('Simple', function() {
		var  input = {zip: '12345'},
			 query = {},
			 f = soar.testQueryObject(input, query);
		assert.equal(query.zip, '12345', 'query is wrong.');
		assert.equal(f.name, 'zip', 'column name is zip');
		assert.equal(f.op, '=', 'operator is =');
	});

	it('and', function() {
		var  input = {zip: '12345', rooms: {op: '>', value: 3}},
			 query = {},
			 f = soar.testQueryObject(input, query);

		assert.equal(query.zip, '12345', 'query is wrong.');
		assert.equal(query.rooms, 3, 'query rooms is 3.');
		assert.equal(f.op, 'and', 'AND contidions');
		assert.equal(f.filters.length, 2, '2 filters');
	});

	it('or', function() {
		var  filters = {zip: '12345', rooms: {op: '>', value: 3}},
			 input = {or: filters},
			 query = {},
			 f = soar.testQueryObject(input, query);

		assert.equal(query.zip, '12345', 'query is wrong.');
		assert.equal(query.rooms, 3, 'query rooms is 3.');
		assert.equal(f.op, 'or', 'or contidions');
		assert.equal(f.filters.length, 2, '2 filters');
	});

	it('compound case #1', function() {
		var  filters = {zip: '12345', rooms: {op: '>', value: 3}},
			 input = {style: 'house', or: filters},
			 query = {},
			 f = soar.testQueryObject(input, query);

		assert.equal(query.zip, '12345', 'query is wrong.');
		assert.equal(query.style, 'house', 'query style is house.');
		assert.equal(query.rooms, 3, 'query rooms is 3.');
		assert.equal(f.op, 'and', 'and contidions');
		assert.equal(f.filters.length, 2, '2 filters');
		assert.equal(f.filters[1].op, 'or', 'sub-query is ORed');
	});

	it('compound case #2', function() {
		var  filters = {zip: '12345', rooms: {op: '>', value: 3}},
			 input = {
				 or: {
					 style: 'house',
					 and: filters
				 }
			 },
			 query = {},
			 f = soar.testQueryObject(input, query);

		assert.equal(query.zip, '12345', 'query is wrong.');
		assert.equal(query.style, 'house', 'query style is house.');
		assert.equal(query.rooms, 3, 'query rooms is 3.');
		assert.equal(f.op, 'or', 'or contidions');
		assert.equal(f.filters.length, 2, '2 filters');
		assert.equal(f.filters[1].op, 'and', 'sub-query is ANDed');
	});

	it('compound case #3', function() {
		var  filters = {zip: '12345', rooms: {op: '>', value: 3}},
			 input = {
				 and: {
					 style: 'house',
					 or: filters
				 }
			 },
			 query = {},
			 f = soar.testQueryObject(input, query);

		assert.equal(query.zip, '12345', 'query is wrong.');
		assert.equal(query.style, 'house', 'query style is house.');
		assert.equal(query.rooms, 3, 'query rooms is 3.');
		assert.equal(f.op, 'and', 'and contidions');
		assert.equal(f.filters.length, 2, '2 filters');
		assert.equal(f.filters[1].op, 'or', 'sub-query is ORed');
	});

	it('compound case #4', function() {
		var  input = {
				 or: {
					 style: 'house',
					 price: {op: '>', value: 400000},
					 and: {
						 zip: '12345',
						 rooms: {op: '>', value: 3}
					 }
				 }
			 },
			 query = {},
			 f = soar.testQueryObject(input, query);

		assert.equal(query.zip, '12345', 'query is wrong.');
		assert.equal(query.style, 'house', 'query style is house.');
		assert.equal(query.rooms, 3, 'query rooms is 3.');
		assert.equal(f.op, 'or', 'or contidions');
		assert.equal(f.filters.length, 3, '3 filters');
		assert.equal(f.filters[2].op, 'and', 'sub-query is ANDed');
	});
});
