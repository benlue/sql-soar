const  async = require('async'),
       soar = require('../../../lib/soar')

// Configure SOAR with PostgreSQL settings
soar.config( {dbConfig: require('../../postgresql/config.json')} );

console.log('Connecting to PostgreSQL database...');

async.waterfall([
    cb => listWithPagination(cb),
], err => {
    if (err)
        console.error( err)
    else
        process.exit(0)
})


function  listWithPagination(cb)  {
    const  cmd = {
                    list: soar.sql('Person'),
                    range: soar.range(1, 2)
                };

    soar.execute(cmd, function(err, list, count) {
        if (err)  return  cb(err)

        console.log( JSON.stringify(list, null, 4) );
        console.log('total entries: ', count)
        // assert.equal( count, 13, 'Totally 13 persons.');
        // assert.equal( list.length, 2, 'page size is 2.');
        cb();
    });
}