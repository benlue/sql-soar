/**
 * sql-soar
 * @author: Ben Lue
 * @copyright: 2023 ~ 2025 Conwell Inc.
 */
const  dbm = require('./DBManager'),
       sqlComp = require('../sql/sqlComp.js'),
       sqlGenMySQL = require('../sql/sqlGenMySql.js'),
       sqlGenPostgreSQL = require('../sql/sqlGenPostgreSQL.js')


/**
 * Execute a SQL statement which is defined in the 'expr' JSON object.
 * Short-hand format:
 *   execute(cmd, handler)
 *   execute(cmd, data, handler) when 'insert' or
 *   execute(cmd, query, handler) for other operations
 */
exports.execute = function(cmd, data, query, handler)  {
    let  sqlExpr = cmd.expr.value()
		
	if (cmd.refresh)
		// clean up cached data
        delete  sqlExpr._count;

    let  nameParts = sqlExpr.table.name.trim().split('.'),
		 dbTable;

	if (nameParts.length > 1)
		dbTable = {
			dbName: nameParts[0],
			tbName: nameParts[1]
		};
	else
		dbTable = {
			dbName: dbm.getDefaultDBName(),
			tbName: nameParts[0]
        };
    //console.log('table names\n' + JSON.stringify(names, null, 4));

	const  ncmd = {...cmd, expr: sqlExpr},
		   needAutoFill = !ncmd.expr.columns || !ncmd.expr.filters,
		   dbConn = dbm.getDB(dbTable.dbName),
		   isPostgreSQL = dbConn.databaseType == 'postgresql'

	if (isPostgreSQL || needAutoFill || ncmd.op == 'insert')
		dbConn.getTableSchema(dbTable.tbName, (err, schema) => {
			if (err)
				handler(err)
			else  {
				// we'll also attach the schema to the original command so we may reuse it in the next run
				ncmd.tableSchema = schema
				// cmd.tableSchema = ncmd.tableSchema = schema
				ncmd.expr = autoFillSchema(dbTable, ncmd, data, query)

				runTemplate(dbConn, ncmd, data, query, handler);
			}
		})
	else
		runTemplate(dbConn, ncmd, data, query, handler)
}


/*
 * Automatically filling missing columns or filters, and run the query
 */
function  autoFillSchema(names, cmd, data, query)  {
	let  tbName = names.tbName,
		 schema = cmd.tableSchema;

	let  stemp = new sqlComp(tbName),	// how about 'table as alias'
		 columns = Object.keys(schema.columns),
		 op = cmd.op,
		 origExpr = cmd.expr;

	if (origExpr.table.join)
		stemp.value().table.join = origExpr.table.join;
	
	if (origExpr.columns)
		stemp.column( origExpr.columns );
	else  {
		if (op === 'query' || op === 'list')
			stemp.column( columns );
		else  if (data)  {
			let  updCols = [];	 
			for (let key in data)  {
				if (data.hasOwnProperty(key))  {
					if (columns.indexOf(key) >= 0)
						updCols.push(key);
				}
			}
				
			if (updCols.length === 0)
				throw new Error('No data for update or insertion.');
			stemp.column( updCols );
		}
	}

	if (query)  {
		if (origExpr.filters)
			stemp.filter( origExpr.filters );
		else  {
			let  filters = [];
			for (const key in query)  {
				if (columns.indexOf(key) >= 0)
					filters.push( {name: key, op: '='} );
			}

			if (filters.length > 0)  {
				const  filter = filters.length == 1  ?  filters[0] : stemp.chainFilters('AND', filters);
				stemp.filter( filter );
			}	
		}
	}

	stemp.extra( origExpr.extra );

	const  stealthExpr = stemp.value()
	stealthExpr.xformer = origExpr.xformer
	return  stealthExpr
}


function  runTemplate(dbConn, cmd, data, query, cb)  {
    if (cmd.conn)
        exeCommand(dbConn, cmd, cmd.conn, data, query, cb);
    else
        dbConn.connect( (err, conn) => {
            if (err)
                return  cb( err );

            exeCommand(dbConn, cmd, conn, data, query, (err, value, count) => {
                conn.release();
                cb(err, value, count);
            });
        });
}


function  exeCommand(dbConn, cmd, conn, data, query, cb)  {
	const  expr = cmd.expr,
		   schema = cmd.tableSchema;

	let  p = [],
         sql = getSqlGenerator(dbConn).toSQL(cmd, data, query, p);
	// console.log('final SQL: ' + sql)

	if (sql)  {
        conn.query(sql, p, (err, value) => {
			if (err)  return  cb(err)

			// console.log('query result\n' + JSON.stringify(value, null, 4));
			const  isMySQL = dbConn.databaseType == 'mysql';
            let  listPaging = cmd.op === 'list' && cmd.range;

            if (cmd.op === 'insert')  {
				const  rtnData = returnInsert(isMySQL, schema, data, value)
				cb(null, rtnData)
			}
			else  if (listPaging)  {
				if (isMySQL)
					mysqlGetResultCount(conn, cmd, query, p, (err, entries) => {
						if (err)
							cb(err);
						else  {
							if (expr.xformer)
								value.forEach( item => applyXformer(expr.xformer, item))
							expr._count = entries
							cb(null, value, entries)
						}
					})
				else  {
					// PostgreSQL
					// we have some minor problems here if the window size is 0 then we can't get the total entries
					// may be fall back to a separate total count query?
					let  data = value.rows,
						 entries = value.rowCount  ?  data[0]._total_entries : 0

					data.forEach(item => delete item._total_entries)
							
					if (expr.xformer)
							data = value.rows.map(item => applyXformer(expr.xformer, item))
					cb(null, data, entries)
				}
			}
			else  {
				let  data = isMySQL ? value : value.rows
				if (cmd.op === 'query')  {
					data = isMySQL ? value[0] : value.rows[0];

					if (expr.xformer)
						applyXformer(expr.xformer, data)
				}
				else  if (cmd.op === 'list' && expr.xformer)
					data.forEach( item => applyXformer(expr.xformer, item))

				cb(null, data);
			}
        });
	}
	else
		cb( new Error('Fail to compose the sql statement.') );
}


function  returnInsert(isMySQL, schema, data, value)  {
	const  pkArray = schema.primary,
		   rtnObj = {};

	if (isMySQL)
		pkArray.forEach( key => rtnObj[key] = data.hasOwnProperty(key)  ?  data[key] : value.insertId )
	else	
		// postgre
		pkArray.forEach( key => rtnObj[key] = data.hasOwnProperty(key)  ?  data[key] : value.rows[0][key] )

	return  rtnObj
}


/**
 * @description mySQL specific function to get the count of a query
 * @param {*} conn 
 * @param {*} cmd 
 * @param {*} query 
 * @param {*} p 
 * @param {*} cb 
 */
function  mysqlGetResultCount(conn, cmd, query, p, cb)  {
	cmd.op = 'listCount';
	const  sql = sqlGenMySQL.toSQL(cmd, null, query, p)

	conn.query(sql, p, (err, result) => {
		if (err)
			cb(err)
		else  {
			const  entries = result.length  ?  result[0].ct : 0;
			cb(null, entries)
		}
	})
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
 * Get the appropriate SQL generator based on database connection type
 */
function getSqlGenerator(dbConn) {
    // Check the constructor name to determine database type
    if (dbConn.constructor.name === 'DBConnPostgreSQL') {
        return sqlGenPostgreSQL;
    }
    // Default to MySQL for backward compatibility
    return sqlGenMySQL;
}