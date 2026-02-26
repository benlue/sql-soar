const  async = require('async'),
       soar = require('../../../lib/soar')


// Configure SOAR with PostgreSQL settings
soar.config( {dbConfig: require('../../postgresql/config.json')} );

console.log('Connecting to PostgreSQL database...');

async.waterfall([
    cb => countTotal(cb),
    cb => updateWithJoinExpr(cb),
    cb => {
        doInsert( (err, pk) => {
            console.log('primary key: ', pk.psnID)
            cb(err)
        })
    },
    cb => {
        doUpdate((err, result) => cb(err))
    },
    cb => {
        doDelete(cb)
    }
], err => {
    if (err)
        console.error( err)
    else
        process.exit(1)
})


function  countTotal(cb)  {
    const  expr = soar.sql('Person')
                      .column(['COUNT(*) as count'])
    const  cmd = {query: expr}

    soar.execute(cmd, {}, (err, result) => {
        if (err)  return  cb(err)

        console.log('count result: ', JSON.stringify(result, null, 4))
        cb()
    })
}


function  updateWithJoinExpr(cb)  {
    const  expr = soar.sql('Person AS psn')
                            .join({table: 'PsnLoc AS pl', onWhat: 'psn.psnID = pl.psnID'})
                            .join({table: 'GeoLoc AS geo', onWhat: 'pl.geID=geo.geID'})
                            .column(['psn.psnID', 'psn.name', 'latitude', 'longitude'])
                            .filter({name: 'psn.psnID', op: '='});
    
    const  cmd = {op: 'update', expr},
           data = {name: 'John Mayer'},
           query = {psnID: 1};
    
    soar.execute(cmd, data, query, function(err) {
        if (err)  return  cb(err)

        cmd.op = 'query';
        soar.execute(cmd, query, function(err, data) {
            if (err)  return  cb(err)

            console.log('Is name chagned to John Mayer? ', data.name == 'John Mayer'  ?  'yes' : 'no')

            // restore data
            cmd.op = 'update';
            soar.execute(cmd, {name: 'John Doe'}, query, err => cb(err))
        });
    });
}


function  doInsert(cb)  {
    const  data = {
                        name: 'Test User',
                        age: 25,
                        weight: 70
                    };

    soar.insert('Person', data, cb)
}


function  doUpdate(cb)  {
    const  data = {age: 26},
           query = {name: 'Test User'};

    soar.update('Person', data, query, cb)
}


function  doDelete(cb)  {
    const  query = {name: 'Test User'};
    soar.del('Person', query, cb)
}