/*!
 * sql-soar
 * authors: Ben Lue
 * license: MIT 
 * License
 * Copyright(c) 2018 ~ 2020 Gocharm Inc.
 */
const  dbm = require('./DBManager'),
       sqlComp = require('../sql/sqlComp.js'),
       sqlGen = require('../sql/sqlGenMySql.js')

/**
 * Execute a SQL statement which is defined in the 'expr' JSON object.
 * Short-hand format:
 *   execute(cmd, handler)
 *   execute(cmd, data, handler) when 'insert' or
 *   execute(cmd, query, handler) for other operations
 */
exports.execute = function(cmd, data, query, handler)  {
    var  sqlExpr = cmd.expr;
	if (typeof sqlExpr === 'string')  {
		// new from v 1.2.0: stored expression
        let  dbConn,
             npath = sqlExpr.split(':'),       // dbName: path_to_the_SQL_expression
			 formulaName;
             
        if (npath.length > 1)  {
            formulaName = npath[1];
            dbConn = dbm.getDB( npath[0] );
        }
        else  {
            formulaName = npath[0];
            dbConn = dbm.getDB();
        }

        sqlExpr = Object.assign({}, dbConn.getFormulaSet(formulaName));
        sqlExpr.xformer = dbConn.getFormulaXFormer(formulaName);
	}
	else  //if (sqlExpr.constructor == sqlComp)
        sqlExpr = sqlExpr.value();
		
	if (cmd.refresh)
		// clean up cached data
        delete  sqlExpr._count;

    //console.log('constructor: ' + sqlExpr.constructor);
    //console.log('sqlExpr:\n' + JSON.stringify(sqlExpr, null, 4));
        
    let  nameParts = sqlExpr.table.name.trim().split('.'),
		 names;

	if (nameParts.length > 1)
		names = {
			dbName: nameParts[0],
			tbName: nameParts[1]
		};
	else
		names = {
			dbName: dbm.getDefaultDBName(),
			tbName: nameParts[0]
        };
    //console.log('table names\n' + JSON.stringify(names, null, 4));

	let  ncmd = Object.assign( {}, cmd );
	ncmd.expr = sqlExpr;
	

	// check & auto-gen the missing parts of a SQL expression
	if (!ncmd.expr.columns || !ncmd.expr.filters)
		// we shall find out the columns of a table
		autoFillSchema(names, ncmd, data, query, handler);
	else
		runTemplate(names, ncmd, data, query, handler);
}


/*
 * Automatically filling missing columns or filters, and run the query
 */
function  autoFillSchema(names, cmd, data, query, cb)  {
    if (cmd.conn)
        autoFillSchemaConn(names, cmd, cmd.conn, data, query, cb);
    else  {
        let  dbName = names.dbName;
        dbm.getDB(dbName).connect( (err, conn) => {
            if (err)  return  cb(err);
            
            autoFillSchemaConn(names, cmd, conn, data, query, (err, result, count) => {
                conn.release();
                if (count != undefined)
                    cb(err, result, count);
                else
                    cb(err, result);
            });
        });
    }
}


/*
 * Automatically filling missing columns or filters, and run the query
 */
function  autoFillSchemaConn(names, options, conn, data, query, handler)  {
	//console.log('expr is\n' + JSON.stringify(options.expr, null, 4));
	let  dbName = names.dbName,
         tbName = names.tbName,
         dbConn = dbm.getDB(dbName);

	dbConn.getTableSchema(conn, tbName, (err, schema) => {
        if (err)  return  handler(err);
        //console.log( JSON.stringify(schema, null, 4) );

		let  stemp = new sqlComp(tbName),	// how about 'table as alias'
			 columns = Object.keys(schema.columns),
			 op = options.op,
			 origExpr = options.expr;

		if (origExpr.table.join)
			stemp.value().table.join = origExpr.table.join;
		
		if (origExpr.columns)
			stemp.column( origExpr.columns );
		else  {
			if (op === 'query' || op === 'list')
				stemp.column( columns );
			else  if (data)  {
				// insert or update, should not put all columns in the statement
				// below looks redundant, but I can't get rid of some propperties coming from nowhere
				// even ownPropertyName() or hasOwnProeprty() cannot remove them
				// a bug in node.js??
				//data = JSON.parse(JSON.stringify(data));
				
				var  updCols = [];	 
				for (var key in data)  {
					if (data.hasOwnProperty(key))  {
						if (columns.indexOf(key) >= 0)
							updCols.push(key);
					}
				}
					
				if (updCols.length === 0)
					return  handler( new Error('No data for update or insertion.') );
				stemp.column( updCols );
			}
		}

		if (query)  {
			if (origExpr.filters)
				stemp.filter( origExpr.filters );
			else  {
				var  filters = [];
				for (var key in query)  {
					if (columns.indexOf(key) >= 0)
						filters.push( {name: key, op: '='} );
				}

				if (filters.length > 0)  {
					var  filter = filters.length == 1  ?  filters[0] : stemp.chainFilters('AND', filters);
					stemp.filter( filter );
				}	
			}
		}

		stemp.extra( origExpr.extra );

		let  stealthExpr = stemp.value(),
			 cmd = {op: op, expr: stealthExpr, range: options.range, conn: conn, debug: options.debug};
		stealthExpr.xformer = origExpr.xformer;
			 
		// copy cached result
		if (origExpr._sql)
			stealthExpr._sql = origExpr._sql;
		if (origExpr._count)
			stealthExpr._count = origExpr._count;
		if (origExpr._query)
			stealthExpr._query = origExpr._query;
		
		runTemplate(names, cmd, data, query, function(err, result, count) {
			// copy cached result
			var  origExpr = options.expr;
			if (stealthExpr._sql)
				origExpr._sql = stealthExpr._sql;
			if (stealthExpr._count)
				origExpr._count = stealthExpr._count;
			if (stealthExpr._query)
				origExpr._query = stealthExpr._query;
				
			handler(err, result, count);
		});
	});
}


function  runTemplate(tableLoc, cmd, data, query, cb)  {
    if (cmd.conn)
        exeCommand(tableLoc, cmd, cmd.conn, data, query, cb);
    else  {
        let  dbConn = dbm.getDB(tableLoc.dbName);
        dbConn.connect( (err, conn) => {
            if (err)
                return  cb( err );

            exeCommand(tableLoc, cmd, conn, data, query, (err, value, count) => {
                conn.release();
                cb(err, value, count);
            });
        });
    }
}


function  exeCommand(tableLoc, options, conn, data, query, cb)  {
	let  p = [],
		 expr = options.expr,
         sql = getSqlGenerator().toSQL(options, data, query, p);

	if (sql)  {
        conn.query(sql, p, function(err, value) {
            let  listPaging = options.op === 'list' && options.range;
            if (err)
                cb(err);
            else  {
                if (options.op === 'insert')
                    returnInsert(conn, tableLoc, data, value, cb);
                else  if (listPaging)  {
					options.op = 'listCount';
					sql = getSqlGenerator().toSQL(options, null, query, p)

					conn.query(sql, p, (err, count) => {
						expr._query = query

						// apply transformer to the results
						if (expr.xformer)
							for (var i in value)
								applyXformer(expr.xformer, value[i])
								
							cb( null, value, expr._count = count && count.length  ?  count[0].ct : 0)
					})
                }
                else  {
                    if (options.op === 'query')  {
                        value = value[0];

                        if (expr.xformer)
                            applyXformer(expr.xformer, value);
                    }
                    else  if (options.op === 'list' && expr.xformer)  {
                        for (var i in value)
                            applyXformer(expr.xformer, value[i]);
                    }  

                    cb(null, value);
                }
            }
        });
	}
	else
		cb( new Error('Fail to compose the sql statement.') );
}


function  returnInsert(conn, tableLoc, data, value, cb)  {
    let  dbConn = dbm.getDB( tableLoc.dbName );
	dbConn.getTableSchema(null, tableLoc.tbName, (err, schema) => {
		if (err)
			cb(err);
		else  {
			let  pkArray = schema.primary,
				 rtnObj = {};

			for (let i in pkArray)  {
				let  key = pkArray[i];
				rtnObj[key] = data.hasOwnProperty(key)  ?  data[key] : value.insertId;
			}

			cb(null, rtnObj);
		}
	});
}


/**
 * Convert data based on the transformer.
 */
function  applyXformer(xformer, data) {
    if (data)  {
        Object.keys(data).forEach( key => {
            if (xformer.hasOwnProperty(key))
				data[key] = xformer[key].call(this, data[key]);
        });
	}
}


/**
 * comparing two query objects
 */
function  sameQuery(q1, q2)  {
	//console.log('q1\n%s', JSON.stringify(q1));
	//console.log('q2\n%s', JSON.stringify(q2));
	var  count1 = q1  ?  Object.keys(q1).length : 0,
		 count2 = q2  ?  Object.keys(q2).length : 0;
		
	if (count1 === count2)  {
		if (count1)  {
			for (var key in q1)  {
				if (q1[key] !==  q2[key])
					return  false;
			}
		}
		return  true;
	}
	
	return  false;
}


function  getSqlGenerator()  {
	return  sqlGen;
}