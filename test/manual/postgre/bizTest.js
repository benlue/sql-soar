const  async = require('async'),
       soar = require('../../../lib/soar')


// Configure SOAR with PostgreSQL settings
soar.config( {dbConfig: require('../../postgresql/config.json')} );

console.log('Connecting to PostgreSQL database...');

async.waterfall([
    cb => readSchema(cb)
], err => {
    if (err)
        console.error( err)
    else
        process.exit(1)
})


function  readSchema(cb)  {
    soar.describeTable('business_facts', (err, schema) => {
        if (err)
            cb(err)
        else  {
            console.log('schema: ', JSON.stringify(schema, null, 4))
            cb()
        }
    })
}
    