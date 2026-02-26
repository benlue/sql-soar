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
 */
exports.execute = async function(cmd, data, query)  {
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

	const  ncmd = {...cmd, expr: sqlExpr},
		   needAutoFill = !ncmd.expr.columns || !ncmd.expr.filters,
		   dbConn = dbm.getDB(dbTable.dbName),
		   isPostgreSQL = dbConn.databaseType == 'postgresql'

	if (isPostgreSQL || needAutoFill || ncmd.op == 'insert')  {
		const  schema = await dbConn.getTableSchema(dbTable.tbName);
		// we'll also attach the schema to the original command so we may reuse it in the next run
		ncmd.tableSchema = schema;
		ncmd.expr = autoFillSchema(dbTable, ncmd, data, query);
	}

	return  await runTemplate(dbConn, ncmd, data, query);
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


async function  runTemplate(dbConn, cmd, data, query)  {
    if (cmd.conn)
        return  await exeCommand(dbConn, cmd, cmd.conn, data, query);

    const  conn = await dbConn.connect();
    try  {
        return  await exeCommand(dbConn, cmd, conn, data, query);
    }
    finally  {
        conn.release();
    }
}


async function  exeCommand(dbConn, cmd, conn, data, query)  {
	const  expr = cmd.expr,
		   schema = cmd.tableSchema;

	let  p = [],
         sql = getSqlGenerator(dbConn).toSQL(cmd, data, query, p);

	if (!sql)
		throw  new Error('Fail to compose the sql statement.');

	const  isMySQL = dbConn.databaseType == 'mysql';
	const  rawResult = await conn.query(sql, p);
	// mysql2/promise returns [rows, fields]; pg returns {rows, rowCount, ...}
	const  value = isMySQL ? rawResult[0] : rawResult;

	let  listPaging = cmd.op === 'list' && cmd.range;

	if (cmd.op === 'insert')  {
		return  returnInsert(isMySQL, schema, data, value);
	}
	else  if (listPaging)  {
		if (isMySQL)  {
			const  entries = await mysqlGetResultCount(conn, cmd, query, p);
			if (expr.xformer)
				value.forEach( item => applyXformer(expr.xformer, item))
			expr._count = entries;
			return  {list: value, count: entries};
		}
		else  {
			// PostgreSQL
			let  pgData = value.rows,
				 entries = value.rowCount  ?  pgData[0]._total_entries : 0;

			pgData.forEach(item => delete item._total_entries);

			if (expr.xformer)
				pgData = value.rows.map(item => applyXformer(expr.xformer, item));
			return  {list: pgData, count: entries};
		}
	}
	else  {
		let  rtnData = isMySQL ? value : value.rows;
		if (cmd.op === 'query')  {
			rtnData = isMySQL ? value[0] : value.rows[0];

			if (expr.xformer)
				applyXformer(expr.xformer, rtnData);
		}
		else  if (cmd.op === 'list' && expr.xformer)
			rtnData.forEach( item => applyXformer(expr.xformer, item));

		return  rtnData;
	}
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
 */
async function  mysqlGetResultCount(conn, cmd, query, p)  {
	cmd.op = 'listCount';
	const  sql = sqlGenMySQL.toSQL(cmd, null, query, p)

	const  [result] = await conn.query(sql, p);
	return  result.length  ?  result[0].ct : 0;
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
