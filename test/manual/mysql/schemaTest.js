const  async = require('async'),
       soar = require('../../../lib/soar');

const options = {
    dbConfig: require('../../mysql/config.json')
};

// Configure SOAR with mysql settings
soar.config(options);

async.waterfall([
    // cb => createTable(cb),
    // cb => alterTable(cb),
    // cb => dropColumn(cb),
    // cb => dropTable(cb),
    cb => alterColumn(cb),
    cb => renameTable(cb)
], err => {
    if (err)
        console.error( err )

    process.exit(0)
})


function  createTable(cb)  {
    const  schema = {
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
    
    soar.getConnection(function(err, conn)  {
        if (err)  return  cb(err)

        soar.createTable( conn, schema, function(err)  {
            if (err)  return  cb(err)

            soar.describeTable(conn, 'TestPage', function(err, readSchema) {
                if (err)  return  cb(err)

                // console.log( JSON.stringify(schema.columns, null, 2) );
                console.log('table title: ', readSchema.title == 'TestPage'  ?  'correct' : 'wrong')
                console.log('table has 2 columns? ', Object.keys(readSchema.columns).length == 2  ?  'yes' : 'no')
                conn.release();
                cb()
            })
        });
    });
}


function  alterTable(cb)  {
    const  schema = {
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
    
    soar.getConnection(function(err, conn)  {
        if (err)  return cb(err)

        soar.alterTable( conn, schema, function(err)  {
            if (err)  return cb(err)

            soar.describeTable(conn, 'TestPage', function(err, readSchema) {
                if (err)  return cb(err)

                // console.log( JSON.stringify(schema.columns, null, 2) );
                console.log('table title: ', readSchema.title == 'TestPage'  ?  'correct' : 'wrong')
                console.log('table has 4 columns? ', Object.keys(readSchema.columns).length == 4  ?  'yes' : 'no')
                conn.release();
                cb()
            })
        });
    });
}


function  dropColumn(cb)  {
    const  schema = {
                        title: 'TestPage',
                        drop: {
                            column: ['year'],
                            index: ['IDX_PAGE_YEAR'],
                            foreignKey: ['FK_pageRpsn']
                        }
                    };
    
    soar.getConnection(function(err, conn)  {
        if (err)  return cb(err)

        soar.alterTable( conn, schema, function(err)  {
            if (err)  return cb(err)

            soar.describeTable(conn, 'TestPage', function(err, readSchema) {
                if (err)  return cb(err)

                //console.log( JSON.stringify(schema.columns, null, 2) );
                console.log('table title: ', readSchema.title == 'TestPage'  ?  'correct' : 'wrong')
                console.log('table has 3 columns? ', Object.keys(readSchema.columns).length == 3  ?  'yes' : 'no')
                conn.release();
                cb()
            })
        });
    });
}


function  dropTable(cb)  {
    soar.getConnection(function(err, conn)  {
        if (err)  return cb(err)

        soar.deleteTable(conn, 'TestPage', function(err)  {
            if (err)  return cb(err)

            conn.release();
            cb();
        });
    });
}


function  alterColumn(cb)  {
    let  schema = {
                    title: 'GeoLoc',
                    alter: {
                        column: {
                            addr: {title: 'geoAddr', type: 'string', maxLength: 256}
                        }
                    }
                };
    
    soar.alterTable( schema, function(err)  {
        if (err)  return cb(err)
        
        soar.describeTable('GeoLoc', function(err, nschema) {
            if (err)  return cb(err)

            //console.log("table columns\n%s", JSON.stringify(nschema.columns, null, 4));
            console.log('do we have the new column [geoAddr]?', nschema.columns.geoAddr  ?  'yes' : 'no')
            
            schema.alter.column = {geoAddr: {title: 'addr', type: 'string', maxLength: 256}};
            
            soar.alterTable( schema, cb)
        });
    });
}


function  renameTable(cb)  {
    soar.renameTable('PsnLoc', 'PsnLoc0', function(err)  {
        if (err)  return cb(err)

        soar.renameTable('PsnLoc0', 'PsnLoc', cb)
    });
}