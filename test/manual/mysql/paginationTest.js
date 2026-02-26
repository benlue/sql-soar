const  async = require('async'),
       soar = require('../../../lib/soar');

const options = {
    dbConfig: require('../../mysql/config.json')
};

// Configure SOAR with mysql settings
soar.config(options);

async.waterfall([
    cb => paginationList(cb),
    cb => paginationWithQuery(cb),
    cb => doUpdate(cb)
], err => {
    if (err)
        console.error( err )

    process.exit(0)
})


function  paginationList(cb)  {
    const  cmd = {
                        list: soar.sql('Person'),
                        range: soar.range(1, 2)
                    };
    
    soar.execute(cmd, function(err, list, count) {
        if (err)
            return  cb(err)


        console.log( JSON.stringify(list, null, 4) );
        console.log('total count: ', count)
        cb()
    });
}


function  paginationWithQuery(cb)  {
    const  expr = soar.sql('Person')
                      .filter({name: 'addr', op: 'IS NULL'});
    
    const  option = {
                        op: 'list',
                        expr: expr,
                        range: soar.range(1, 2),
                        refresh: true
                    };
    
    soar.execute(option, function(err, list, count) {
        if (err)  return  cb(err)

        console.log( JSON.stringify(expr.value(), null, 4) );
        console.log('existing count is ' + expr.value()._count)
        
        const query = {addr: true};
        soar.execute(option, query, function(err, list, count) {
            if (err)  return  cb(err)

            console.log('total count is ' + count);
            console.log( JSON.stringify(list, null, 4) );
            cb()
        });
    });
}


function  doUpdate(cb)  {
    const  expr = soar.sql('Person')
                            .column(['psnID', 'name'])
                            .filter( {name: 'psnID', op: '='} );
    
    let  option = {update: expr},
         data = {name: 'John Mayer'},
         query = {psnID: 1};
    
    soar.execute(option, data, query, function(err) {
        if (err)  return  cb(err)

        delete  option.update;
        option.query = expr;
        soar.execute(option, query, function(err, data) {
            if (err)  return  cb(err)

            console.log(`name[${data.name}] after update should be "John Mayer"`)

            // restore data
            delete  option.query;
            option.update = expr;
            soar.execute(option, {name: 'John'}, query, cb)
        });
    })
}