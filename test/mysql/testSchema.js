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


describe('Schema manipulation with connection specified', function()  {

    it('Create table', async function() {
    	var  schema = {
    		 	title: 'TestPage',
			    columns: {
			        page_id: {type: 'serial'},
			        title: {
			            type: 'string',
			            maxLength: 32
			        }
			    },
			    primary:  ['page_id']
    		 };

    	const conn = await soar.getConnection();
    	await soar.createTable( conn, schema);
    	assert(true, 'Creation failed');

    	const resultSchema = await soar.describeTable(conn, 'TestPage');
    	//console.log( JSON.stringify(resultSchema.columns, null, 2) );
    	assert.equal(resultSchema.title, 'TestPage', 'table name is wrong');
    	assert.equal(Object.keys(resultSchema.columns).length, 2, 'table has 2 columns');
        conn.release();
    });

    it('Alter table -- add', async function() {
    	var  schema = {
    		title: 'TestPage',
    		add: {
    			column: {
    				year: {type:'integer', format: 'int16'},
    				psnID: {type: 'integer', format: 'int64'}
    			},
    			index: {
	            IDX_PAGE_YEAR: {
	                columns: ['year']
	            }
	        },
	        foreignKey: {
	            FK_pageRpsn: {
	                key: 'psnID',
	                reference: 'Person.psnID',
	                integrity: {
	                    delete: 'cascade',
	                    update: 'cascade'
	                }
	            }
	        }
    		}
    	};

    	const conn = await soar.getConnection();
    	await soar.alterTable( conn, schema);
    	assert(true, 'Altering table failed');

    	const resultSchema = await soar.describeTable(conn, 'TestPage');
    	//console.log( JSON.stringify(resultSchema.columns, null, 2) );
    	assert.equal(resultSchema.title, 'TestPage', 'table name is wrong');
    	assert.equal(Object.keys(resultSchema.columns).length, 4, 'table has 4 columns');
        conn.release();
    });

    it('Alter table -- drop', async function() {
        var  schema = {
            title: 'TestPage',
            drop: {
                column: ['year'],
                index: ['IDX_PAGE_YEAR'],
                foreignKey: ['FK_pageRpsn']
            }
        };

        const conn = await soar.getConnection();
        await soar.alterTable( conn, schema);
        assert(true, 'Altering table failed');

        const resultSchema = await soar.describeTable(conn, 'TestPage');
        //console.log( JSON.stringify(resultSchema.columns, null, 2) );
        assert.equal(resultSchema.title, 'TestPage', 'table name is wrong');
        assert.equal(Object.keys(resultSchema.columns).length, 3, 'table has 3 columns');
        conn.release();
    });

    it('Delete table', async function() {
    	const conn = await soar.getConnection();
    	await soar.deleteTable(conn, 'TestPage');
    	assert(true, 'Deletion failed');
        conn.release();
    });
});

describe('Schema manipulation without connection specified', function()  {

    it('Alter table -- change column', async function() {
    	var  schema = {
    		title: 'GeoLoc',
    		alter: {
    			column: {
    				addr: {title: 'geoAddr', type: 'string', maxLength: 256}
    			}
    		}
    	};

		await soar.alterTable( schema);
		assert(true, 'Altering table failed');

        const nschema = await soar.describeTable('GeoLoc');
        //console.log("table columns\n%s", JSON.stringify(nschema.columns, null, 4));
        assert(nschema.columns.geoAddr, 'geoAddr is the new column name');

        schema.alter.column = {geoAddr: {title: 'addr', type: 'string', maxLength: 256}};

        await soar.alterTable( schema);
    });

    it('rename table', async function() {
        await soar.renameTable('PsnLoc', 'PsnLoc0');
        await soar.renameTable('PsnLoc0', 'PsnLoc');
    });

    it('Create table', async function() {
        var  schema = {
                title: 'TestPage',
                columns: {
                    page_id: {type: 'serial'},
                    title: {
                        type: 'string',
                        maxLength: 32
                    }
                },
                primary:  ['page_id']
             };

        await soar.createTable( schema);
        assert(true, 'Creation failed');

        const resultSchema = await soar.describeTable('TestPage');
        //console.log( JSON.stringify(resultSchema.columns, null, 2) );
        assert.equal(resultSchema.title, 'TestPage', 'table name is wrong');
        assert.equal(Object.keys(resultSchema.columns).length, 2, 'table has 2 columns');
    });

    it('Alter table -- add', async function() {
        var  schema = {
            title: 'TestPage',
            add: {
                column: {
                    year: {type:'integer', format: 'int16'},
                    psnID: {type: 'integer', format: 'int64'}
                },
                index: {
                    IDX_PAGE_YEAR: {
                        columns: ['year']
                    }
                },
                foreignKey: {
                    FK_pageRpsn: {
                        key: 'psnID',
                        reference: 'Person.psnID',
                        integrity: {
                            delete: 'cascade',
                            update: 'cascade'
                        }
                    }
                }
            }
        };

        await soar.alterTable( schema);
        assert(true, 'Altering table failed');

        const resultSchema = await soar.describeTable('TestPage');
        //console.log( JSON.stringify(resultSchema.columns, null, 2) );
        assert.equal(resultSchema.title, 'TestPage', 'table name is wrong');
        assert.equal(Object.keys(resultSchema.columns).length, 4, 'table has 4 columns');
    });

    it('Alter table -- drop', async function() {
        var  schema = {
            title: 'TestPage',
            drop: {
                column: ['year'],
                index: ['IDX_PAGE_YEAR'],
                foreignKey: ['FK_pageRpsn']
            }
        };

        await soar.alterTable( schema);
        assert(true, 'Altering table failed');

        const resultSchema = await soar.describeTable('TestPage');
        //console.log( JSON.stringify(resultSchema.columns, null, 2) );
        assert.equal(resultSchema.title, 'TestPage', 'table name is wrong');
        assert.equal(Object.keys(resultSchema.columns).length, 3, 'table has 3 columns');
    });

    it('Delete table', async function() {
        await soar.deleteTable('TestPage');
        assert(true, 'Deletion failed');
    });

});
