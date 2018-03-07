/*!
 * core/DBConn.js
 * authors: Ben Lue
 * Copyright(c) 2018 Gocharm Inc.
 */
const  fs = require('fs'),
       path = require('path'),
       DBConn = require('./DBConn');

var  useDB = {},
     formulaMap = {},
     _dftName;

exports.init = function(options)  {
    // destroy the old pools if soar is being re-
    if (Object.keys(useDB).length === 0)  {
        let  dbNames = Object.getOwnPropertyNames(useDB);
        for (let i in dbNames)
            useDB[dbNames[i]].closeDown();
    }

    useDB = {};

    if (!options)  {
        let  configFile = options || path.join(__dirname, '../../config.json');
        options = JSON.parse( fs.readFileSync(configFile) );
    }

    if (!Array.isArray(options))
        options = new Array( options );

    options.forEach( (opt) => {
        let  dbConfig = opt.dbConfig,
             dbConn = new DBConn( dbConfig ),
             dbName = dbConn.name;
        //console.log('[%s] db config:\n[%s]', dbName, JSON.stringify(dbConfig, null, 4));
        useDB[dbName] = dbConn;

        if (!_dftName)
            _dftName = dbName;

        if (opt.storedExpr)  {
            let  storeExprPath = opt.storedExpr,
                 repoPath = storeExprPath.charAt(0) === '/'  ?  storeExprPath : path.join(__dirname, storeExprPath);
            loadFormula(dbName, repoPath, '/');
        }
    });
}


exports.getDB = function(dbName)  {
    let  name = dbName  ?  dbName : _dftName;
    //console.log('<< dbName:%s, dftName: %s, name:%s', dbName, _dftName, name);
    //console.log('db name: ' + DBConn.prototype._dftName);
    return  useDB[name];
}


exports.getConnection = function(dbName, cb)  {
    let  name = dbName || _dftName;
    useDB[name].connect(cb);
}


exports.getDefaultDBName = function()  {
    return  _dftName;
}


/**
 * Load stored SQL expressions for a DB
 */
function  loadFormula(dbName, repoPath, prefix)  {
    let  flist = fs.readdirSync( repoPath ),
         dbConn = exports.getDB( dbName );
    
	for (let i in flist)  {
		let  fmName = flist[i],
			 fmPath = path.join(repoPath, fmName),
			 stats = fs.statSync( fmPath );
			 
		if (fmName.charAt(0) != '.' && stats.isFile())  {
			try  {
				let  formula = getFormula(fmPath),
                     fmKey = prefix + fmName.substring(0, fmName.lastIndexOf('.')),
                     sqlExpr = Object.assign({}, formula.soar);
                
				dbConn.formulaSet[fmKey] = sqlExpr;

				// do some sanity check
				let  columns = sqlExpr.columns,
                     fXromer = {};
                
                if (typeof columns === 'string')
                    columns = new Array(columns);

                if (Array.isArray(columns))  {
                    columns.forEach( (field, index) => {
                        if (typeof field === 'object')  {
                            // this column specification has a transformer associated with it
                            var  cname = Object.getOwnPropertyNames(field)[0],
                                 xformer = field[cname];
    
                            columns[index] = cname;
    
                            // save the field-xformer mappings
                            let  idx = cname.lastIndexOf(' ');	// check for 'something as alias'
                            if (idx < 0)
                                idx = cname.indexOf('.');
                            if (idx > 0)
                                cname = cname.substring(idx+1);
    
                            fXromer[cname] = xformer;
                        }
                        else  if (typeof field !== 'string')
                            throw  new Error('Some table columns are not in corret format.');
                    });
                }

                sqlExpr.columns = columns;
                //console.log('load formula:\n' + JSON.stringify(sqlExpr, null, 4));

				if (Object.getOwnPropertyNames(fXromer).length)
                    dbConn.formulaXformer[fmKey] = fXromer;
			}
			catch (e)  {
				console.log( e.stack );
			}
		}
		else  if (stats.isDirectory())
			// let's dig in
			loadFormula( dbName, fmPath, prefix + fmName + '/' );
	}
}


function  getFormula(fmPath)  {
    let  formula = formulaMap[fmPath];

    if (!formula)
        formulaMap[fmPath] = formula = require(fmPath);
        
    return  formula;
}