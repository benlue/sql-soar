/*!
* sql-soar
* authors: Ben Lue
* license: MIT License
* Copyright(c) 2015 Gocharm Inc.
*/
var  dbConn = require('./dbConn.js'),
	 fs = require('fs'),
	 path = require('path'),
	 sqlGen = require('./sqlGenMySql.js'),
	 schMgr = require('./schemaManager.js'),
	 sqlComp = require('./sqlComp.js');

var  schemaCache = {},	// cache the table schemas
	 dftDB,			// name of the default database
	 DEF_PAGE_SIZE = 20,
	 useDB = {},
	 _noArgOP = ['IS NOT NULL', 'IS NULL'];

var  Range = (function() {

	function  Range(pageIdx, pSize)  {
		this.pageIdx = pageIdx;			// page index starts from 1
		this.pageSize = pSize || DEF_PAGE_SIZE;
	};

	Range.prototype.getIndex = function()  {
		return  (this.pageIdx - 1) * this.pageSize;
	};

	Range.prototype.getPageSize = function()  {
		return  this.pageSize;
	};

	return  Range;
})();

exports.range = function newRange(idx, size)  {
	return  new Range(idx, size);
};

exports.sql = function(tableName)  {
	return  new sqlComp(tableName);
};

/**
 * Offered to be compatible with the original SOAR module.
 */
exports.sqlTemplate = function(tableName)  {
	return  new sqlComp(tableName);
};

exports.chainFilters = function(op, filters)  {
	return  {op: op, filters: filters};
};

function  getSchemaManager() {
	return  schMgr;
};

exports.config = function(options)  {
	if (!options)  {
		var  configFile = options || path.join(__dirname, '../config.json');
		options = JSON.parse( fs.readFileSync(configFile) );
	}

	if (Array.isArray(options))  {
		dftDB = configDB(options[0]);

		for (var i = 1, len = options.length; i < len; i++)
			configDB(options[i]);
	}
	else
		dftDB = configDB(options);
};


function  configDB(options)  {
	var  dbConfig = options.dbConfig;
	if (!dbConfig)
		throw  new Error('Cannot find database configuration');

	// first, set up db connection
	var  dbName = dbConfig.database;
	useDB[dbName] = new dbConn(dbConfig);

	return  dbName;
};


exports.getConnection = function(dbName, handler)  {
	if (!handler)  {
		handler = dbName;
		dbName = dftDB;
	}
	//dbName = dbName || dftDB;
	useDB[dbName].getConnection(handler);
};


exports.runSql = function(dbName, sql, p, cb)  {
	if (arguments.length < 3)
		return  cb( new Error("Wrong parameters") );
		
	if (arguments.length < 4)  {
		cb = p;
		p = sql;
		sql = dbName;
		dbName = dftDB;
	}
	else  {
		if (typeof dbName === 'string')
			useDB[dbName].getConnection( function(err, conn) {
				if (err)
					cb( err );
				else
					conn.query(sql, p, cb);
			});
		else  {
			var  conn = dbName;
			conn.query(sql, p, cb);
		}
	}
	
	
};


/**
 * Create a new table.
 */
exports.createTable = function(conn, schema, cb)  {
	if (arguments.length < 2)
		return  cb( new Error("Wrong parameters") );
		
	if (arguments.length === 2)  {
		cb = schema;
		schema = conn;
		conn = null;
	}

	if (conn)
		getSchemaManager().createTable(conn, schema, cb);
	else  {
		exports.getConnection(function(err, conn)  {
			if (err)
				cb(err);
			else
				getSchemaManager().createTable(conn, schema, function(err, result) {
					conn.release();
					cb(err, result);
				});
		});
	}
};


exports.alterTable = function(conn, schema, cb)  {
	if (arguments.length < 2)
		return  cb( new Error("Wrong parameters") );
		
	if (arguments.length === 2)  {
		cb = schema;
		schema = conn;
		conn = null;
	}

	if (conn)
		getSchemaManager().alterTable(conn, schema, cb);
	else  {
		exports.getConnection(function(err, conn)  {
			if (err)
				cb(err);
			else
				getSchemaManager().alterTable(conn, schema, function(err) {
					conn.release();
					cb(err);
				});
		});
	}
};


exports.deleteTable = function(conn, tbName, cb)  {
	if (arguments.length < 2)
		return  cb( new Error("Wrong parameters") );
		
	if (arguments.length === 2)  {
		cb = tbName;
		tbName = conn;
		conn = null;
	}

	if (conn)
		getSchemaManager().deleteTable(conn, tbName, cb);
	else  {
		exports.getConnection(function(err, conn)  {
			if (err)
				cb(err);
			else
				getSchemaManager().deleteTable(conn, tbName, function(err) {
					conn.release();
					cb(err);
				});
		});
	}
};


exports.renameTable = function(conn, oldName, newName, cb)  {
	if (arguments.length < 3)
		return  cb( new Error("Wrong parameters") );
	
	if (arguments.length === 3)  {
		cb = newName;
		newName = oldName;
		oldName = conn;
		conn = null;
	}

	if (conn)
		getSchemaManager().renameTable(conn, oldName, newName, cb);
	else  {
		exports.getConnection(function(err, conn)  {
			if (err)
				cb(err);
			else
				getSchemaManager().renameTable(conn, oldName, newName, function(err) {
					conn.release();
					cb(err);
				});
		});
	}
};


exports.describeTable = function(conn, tbName, cb)  {
	if (arguments.length < 2)
		return  cb( new Error("Wrong parameters") );
		
	if (arguments.length === 2)  {
		cb = tbName;
		tbName = conn;
		conn = null;
	}

	if (conn)
		getSchemaManager().describeTable(conn, tbName, cb);
	else  {
		exports.getConnection(function(err, conn)  {
			if (err)
				cb(err);
			else
				getSchemaManager().describeTable(conn, tbName, function(err, schema) {
					conn.release();
					cb(err, schema);
				});
		});
	}
};


exports.insert = function(tbName, data, cb)  {
	var  sql = exports.sql(tbName),
		 cmd = {
			 op: 'insert',
			 expr: sql
		 };
		 
	exports.execute(cmd, data, null, cb);
};


exports.query = function(tbName, input, cb)  {
	var  query = {},
		 filter = retrieveFilter(input, query),
		 sql;

	if (typeof tbName === 'string')
		sql = exports.sql(tbName).filter(filter);
	else  if (tbName.constructor == sqlComp)
		sql = tbName;
	else
		return  cb( new Error("The table name or the SQL expression should be specified.") );
		 
	var  cmd = {
			 op: 'query',
			 expr: sql
		 };
		 
	exports.execute(cmd, null, query, cb);
};


exports.list = function(tbName, input, cb)  {
	var  query = {},
		 filter = retrieveFilter(input, query),
		 sql;

	if (typeof tbName === 'string')
		sql = exports.sql(tbName).filter(filter);
	else  if (tbName.constructor == sqlComp)
		sql = tbName;
	else
		return  cb( new Error("The table name or the SQL expression should be specified.") );
		 
	var  cmd = {
			 op: 'list',
			 expr: sql
		 };
		 
	exports.execute(cmd, null, query, cb);
};


exports.update = function(tbName, data, input, cb)  {
	var  query = {},
		 filter = retrieveFilter(input, query);
		 
	var  sql = exports.sql(tbName).filter(filter),
		 cmd = {
			 op: 'update',
			 expr: sql
		 };
		 
	exports.execute(cmd, data, query, cb);
};


exports.del = function(tbName, input, cb)  {
	var  query = {},
		 filter = retrieveFilter(input, query);
		 
	var  sql = exports.sql(tbName).filter(filter),
		 cmd = {
			 op: 'delete',
			 expr: sql
		 };
		 
	exports.execute(cmd, null, query, cb);
};


/**
 * Execute a SQL statement which is defined in the 'expr' JSON object
 */
exports.execute = function(options, data, query, handler)  {
	switch (arguments.length)  {
		case  2:
			handler = data;
			data = options.data;
			query = options.query;
			break;

		case  3:
			handler = query;
			query = data;
			data = null;
			break;
	}
	query = query || {};

	if (!options.expr || !options.op)
		return  handler( new Error('options is missing the sql expression or operator.') );

	if (options.expr.constructor == sqlComp)
		options.expr = options.expr.value();
		
	if (options.refresh)
		// clean up cached data
		delete  options.expr._count;
		
	var  tableName = options.expr.table.name,
		 idx = tableName.indexOf('.'),
		 dbName,
		 tbName;

	if (idx > 0)  {
		dbName = tableName.substring(0, idx);
		tbName = tableName.substring(idx+1);
	}
	else  {
		dbName = dftDB;
		tbName = tableName;
	}

	// check & auto-gen the missing parts of a SQL expression
	if (!options.expr.columns || !options.expr.filters)
		// we shall find out the columns of a table
		autoFillSchema(dbName, tbName, options, data, query, handler);
	else
		//runTemplate(tableLoc, options, data, query, handler);
		runTemplate({dbName: dbName, tbName: tbName}, options, data, query, handler);
};


/*
* Automatically filling missing columns or filters, and run the query
*/
function  autoFillSchema(dbName, tbName, options, data, query, handler)  {
	getTableSchema(dbName, tbName, function(err, schema) {
		if (err)
			return  handler(err);

		var  stemp = exports.sql(tbName),	// how about 'table as alias'
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
					return  handler( new Error('No data to update or insert.') );
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

		var  stealthExpr = stemp.value(),
			 cmd = {op: op, expr: stealthExpr, range: options.range, conn: options.conn, debug: options.debug};
			 
		// copy cached result
		if (origExpr._sql)
			stealthExpr._sql = origExpr._sql;
		if (origExpr._count)
			stealthExpr._count = origExpr._count;
		if (origExpr._query)
			stealthExpr._query = origExpr._query;
		
		runTemplate({dbName: dbName, tbName: tbName}, cmd, data, query, function(err, result, count) {
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
};


function  runTemplate(tableLoc, options, data, query, handler)  {
	var  p = [],
		 expr = options.expr,
		 sql = getSqlGenerator().toSQL(options, data, query, p);

	if (sql)  {
		if (options.conn)
			options.conn.query(sql, p, function(err, value) {
				if (err)
					options.conn.rollback(function() {
						handler( err );
					});
				else  {
					if (options.op === 'insert')
						returnInsert(tableLoc, data, value, handler);
					else  if (options.op == 'list' && options.range)  {
						if (expr._count && sameQuery(expr._query, query))
							// reuse total count
							handler( null, value, expr._count );
						else  {
							options.op = 'listCount';
							p = [];
							
							sql = getSqlGenerator().toSQL(options, data, query, p);
							options.conn.query(sql, p, function(err, count) {
								expr._query = query;
								handler( null, value, expr._count = count[0].ct );
							});
						}
					}
					else  {
						if (options.op === 'query')
							value = value[0];
						handler(null, value);
					}
				}
			});
		else  {
			useDB[tableLoc.dbName].getConnection( function(err, conn) {
				if (err)
					handler( err );
				else
					conn.query(sql, p, function(err, value) {
						var  connDone = options.op !== 'list' || !options.range ||
										(expr._count && sameQuery(expr._query, query));
						if (connDone)
							conn.release();

						if (err)
							handler( err );
						else  {
							if (options.op === 'insert')
								returnInsert(tableLoc, data, value, handler);
							else  if (options.op === 'list' && options.range)  {
								//if (expr._count)
								if (connDone)  {
									// reuse total count
									//console.log('use total count: ' + expr._count);
									handler( null, value, expr._count );
								}
								else  {
									options.op = 'listCount';
									p = [];
									
									sql = getSqlGenerator().toSQL(options, data, query, p);
									conn.query(sql, p, function(err, count) {
										conn.release();
										expr._query = query;
										handler( null, value, expr._count = count[0].ct );
									});
								}
							}
							else  {
								if (options.op === 'query')
									value = value[0];
								handler(null, value);
							}
						}
					});
			});
		}
	}
	else
		handler( new Error('Fail to compose the sql statement.') );
};


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
};


function  returnInsert(tableLoc, data, value, cb)  {
	getTableSchema(tableLoc.dbName, tableLoc.tbName, function(err, schema) {
		if (err)
			cb(err);
		else  {
			var  pkArray = schema.primary,
				 rtnObj = {};

			for (var i in pkArray)  {
				var  key = pkArray[i];
				rtnObj[key] = data.hasOwnProperty(key)  ?  data[key] : value.insertId;
			}

			cb(null, rtnObj);
		}
	});
};


function  getTableSchema(dbName, tbName, cb)  {
	var  tbSchema = schemaCache[dbName];
	if (!tbSchema)  {
		tbSchema = {};
		schemaCache[dbName] = tbSchema;
	}

	// watch out for table alias
	var  tbParts = tbName.trim().split(' ');
	if (tbParts.length > 1)
		tbName = tbParts[0];

	var  schema = tbSchema[tbName];
	if (schema)
		cb( null, schema );
	else
		exports.getConnection(dbName, function(err, conn) {
			if (err)
				cb(err);
			else
				schMgr.describeTable(conn, tbName, function(err, schema) {
					conn.release();

					if (err)
						cb(err);
					else  {
						tbSchema[tbName] = schema;
						cb(null, schema);
					}
				});
		});
};


/**
 * export this for testing purpose.
 * Do not invoke this.
 */
exports.testQueryObject = function(input, query)  {
	return  retrieveFilter(input, query);
}


function  retrieveFilter(input, query, op)  {
	if (Object.keys(input).length === 0)
		return  null;

	var  filters = [];
	op = op || 'and';
	
	for (var key in input)  {
		if (key === 'or' || key === 'and')  {
			var  f = retrieveFilter(input[key], query, key);
			if (f)
				filters.push(f);
		}
		else  if (typeof input[key] === 'object')  {
			var  f,
				 kv = input[key];
				 
			if (kv.op)  {
				if (_noArgOP.indexOf(kv.op) >= 0)  {
					f = {name: key, op: kv.op};
					query[key] = true;
				}
				else  if (kv.hasOwnProperty('value'))  {
					f = {name: key, op: kv.op};
					query[key] = kv.value;
				}

				if (f)
					filters.push( f );
			}
			else  {
				filters.push( {name: key, op: '='} );
				query[key] = kv;
			}
		}
		else  {
			filters.push( {name: key, op: '='} );
			query[key] = input[key];
		}
	}
	
	if (filters.length > 1)
		return  {op: op, filters: filters};

	return  filters[0];
};


function  getSqlGenerator()  {
	return  sqlGen;
};


exports.setDebug = function  setDebug(b)  {
	getSqlGenerator().setDebug( b );
};