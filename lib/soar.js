/*!
* sql-soar
* authors: Ben Lue
* license: MIT License
* Copyright(c) 2015 ~ 2016 Gocharm Inc.
*/
var  dbConn = require('./dbConn.js'),
	 fs = require('fs'),
	 path = require('path'),
	 sqlGen = require('./sqlGenMySql.js'),
	 schMgr = require('./schemaManager.js'),
	 sqlComp = require('./sqlComp.js');

var  schemaCache = {},	// cache the table schemas
	 dftDB,				// name of the default database
	 DEF_PAGE_SIZE = 20,
	 useDB,
	 formulaSet = {},	// SOAR definition files for every DB
	 formulaXformer = {},
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
	// destroy the old pools if soar is being re-configured
	if (useDB)  {
		var  dbNames = Object.getOwnPropertyNames(useDB);
		for (var i in dbNames)
			useDB[dbNames[i]].closeDown();
	}

	useDB = {};
	//formulaSet = {};

	if (!options)  {
		var  configFile = options || path.join(__dirname, '../config.json');
		options = JSON.parse( fs.readFileSync(configFile) );
	}

	if (Array.isArray(options))  {
		for (var i in options)  {
			var  dbName = configDB(options[i]);
			// i is a string, not an integer
			if (i == 0)
				dftDB = dbName;
		}
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

	if (options.storedExpr)  {
		var  repoPath = options.storedExpr.charAt(0) === '/'  ?  options.storedExpr : path.join(__dirname, options.storedExpr);
		loadFormula(dbName, repoPath, '/');
	}

	return  dbName;
};


/**
 * Load stored SQL expressions for a DB
 */
function  loadFormula(dbName, repoPath, prefix)  {
	var  flist = fs.readdirSync( repoPath );
	for (var i in flist)  {
		var  fmName = flist[i],
			 fmPath = path.join(repoPath, fmName),
			 stats = fs.statSync( fmPath );
			 
		if (fmName.charAt(0) != '.' && stats.isFile())  {
			try  {
				var  formula = require(fmPath),
					 idx = fmName.lastIndexOf('.'),
					 fmKey = prefix + fmName.substring(0, idx);

				var  sqlExpr = {};
				formulaSet[fmKey] = Object.assign(sqlExpr, formula.soar);

				// do some sanity check
				var  columns = sqlExpr.columns,
					 fXromer = {};
				for (var i in columns)  {
					var  field = columns[i];

					if (typeof field === 'object')  {
						// this column specification has a transformer associated with it
						var  cname = Object.getOwnPropertyNames(field)[0],
							 xformer = field[cname];

						columns[i] = cname;

						// save the field-xformer mappings
						var  idx = cname.lastIndexOf(' ');	// check for 'something as alias'
						if (idx < 0)
							idx = cname.indexOf('.');
						if (idx > 0)
							cname = cname.substring(idx+1);

						fXromer[cname] = xformer;
					}
					else  if (typeof field !== 'string')
						throw  new Error('Some table columns are not in corret format.');
				}
				sqlExpr.columns = columns;

				if (Object.getOwnPropertyNames(fXromer).length)
					formulaXformer[fmKey] = fXromer;
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


exports.getConnection = function(dbName, handler)  {
	if (!handler)  {
		handler = dbName;
		dbName = dftDB;
	}
	
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
	//console.log('runSql: dbName is %s, typeof dbName is %s', dbName, (typeof dbName));

	if (typeof dbName === 'string')
		useDB[dbName].getConnection( function(err, conn) {
			if (err)  {
				console.log( err.stack );
				cb( err );
			}
			else  {
				// The acquired connection should be released.
				//conn.query(sql, p, cb);
				conn.query(sql, p, function(err, value) {
					conn.release();
					cb(err, value);
				});
			}
		});
	else  {
		var  conn = dbName;
		conn.query(sql, p, cb);
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
		 filter,
		 sql;

	switch (arguments.length)  {
		case 2:
			cb = input;
			break;

		case 3:
			filter = retrieveFilter(input, query);
			break;

		default:
			throw new Error("Wrong arguments.");
	}

	if (typeof tbName === 'string')  {
		if (filter)
			sql = exports.sql(tbName).filter(filter);
		else
			sql = exports.sql(tbName);
	}
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
		return  handler( new Error('The command is missing the sql expression or operator.') );

	var  sqlExpr = options.expr;
	if (typeof options.expr === 'string')  {
		// new from v 1.2.0: stored expression
		var  formulaName = options.expr,
			 sqlExpr = {};

		Object.assign(sqlExpr, formulaSet[formulaName]);
		sqlExpr.xformer = formulaXformer[formulaName];
	}
	else  if (options.expr.constructor == sqlComp)
		sqlExpr = options.expr.value();
		
	if (options.refresh)
		// clean up cached data
		delete  sqlExpr._count;
		
	var  tableName = sqlExpr.table.name,
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

	var  cmd = {};
	Object.assign( cmd, options );
	cmd.expr = sqlExpr;
	
	//console.log('sql expression is\n' + JSON.stringify(sqlExpr, null, 4));

	// check & auto-gen the missing parts of a SQL expression
	if (!cmd.expr.columns || !cmd.expr.filters)
		// we shall find out the columns of a table
		autoFillSchema(dbName, tbName, cmd, data, query, handler);
	else
		//runTemplate(tableLoc, options, data, query, handler);
		runTemplate({dbName: dbName, tbName: tbName}, cmd, data, query, handler);
};


/*
* Automatically filling missing columns or filters, and run the query
*/
function  autoFillSchema(dbName, tbName, options, data, query, handler)  {
	//if (options.expr.xformer)
	//	console.log('autoFillSchema: has xformer? ' + (Object.getOwnPropertyNames(options.expr.xformer).length > 0));

	//console.log('expr is\n' + JSON.stringify(options.expr, null, 4));
	getTableSchema(options.conn, dbName, tbName, function(err, schema) {
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
		stealthExpr.xformer = origExpr.xformer;
			 
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
						returnInsert(options.conn, tableLoc, data, value, handler);
					else  if (options.op == 'list' && options.range)  {
						if (expr._count && sameQuery(expr._query, query))
							// reuse total count
							handler( null, value, expr._count );
						else  {
							//options.op = 'listCount';
							//p = [];
							
							//sql = getSqlGenerator().toSQL(options, data, query, p);
							sql = 'SELECT FOUND_ROWS() AS ct;';
							options.conn.query(sql, null, function(err, count) {
								expr._query = query;

								// apply transformer to the results
								if (expr.xformer)
									for (var i in value)
										applyXformer(expr.xformer, value[i]);

								handler( null, value, expr._count = count[0].ct );
							});
						}
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
						var  listPaging = options.op === 'list' && options.range;
						if (!listPaging)
							conn.release();

						if (err)
							handler( err );
						else  {
							if (options.op === 'insert')
								returnInsert(conn, tableLoc, data, value, handler);
							else  if (listPaging)  {
								// shoud not reuse the total count (entries may be inserted or deleted)
								//options.op = 'listCount';
								//p = [];
								
								//sql = getSqlGenerator().toSQL(options, data, query, p);
								sql = 'SELECT FOUND_ROWS() AS ct;';
								conn.query(sql, null, function(err, count) {
									conn.release();
									expr._query = query;

									// apply transformer to the results
									if (expr.xformer)
										for (var i in value)
											applyXformer(expr.xformer, value[i]);

									handler( null, value, expr._count = count[0].ct );
								});
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


function  applyXformer(xformer, data) {
	var  keys = Object.getOwnPropertyNames(data);
	for (var i in keys)  {
		var  key = keys[i];
		
		if (xformer.hasOwnProperty(key))
			data[key] = xformer[key].call(this, data[key]);
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
};


function  returnInsert(conn, tableLoc, data, value, cb)  {
	getTableSchema(conn, tableLoc.dbName, tableLoc.tbName, function(err, schema) {
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


function  getTableSchema(conn, dbName, tbName, cb)  {
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
	else  if (conn)  {
		schMgr.describeTable(conn, tbName, function(err, schema) {
			if (err)
				cb(err);
			else  {
				tbSchema[tbName] = schema;
				cb(null, schema);
			}
		});
	}
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