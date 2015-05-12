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
	 useDB = {};

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

exports.getConnection = function(dbName, handler)  {
	if (!handler)  {
		handler = dbName;
		dbName = dftDB;
	}
	//dbName = dbName || dftDB;
	useDB[dbName].getConnection(handler);
};


/**
 * Create a new table.
 */
exports.createTable = function(conn, schema, cb)  {
	if (arguments.length < 2)
		cb( new Error("Wrong parameters") );
		
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
		cb( new Error("Wrong parameters") );
		
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
		cb( new Error("Wrong parameters") );
		
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
		cb( new Error("Wrong parameters") );
	
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
		cb( new Error("Wrong parameters") );
		
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
		throw  new Error("The table name or the SQL expression should be specified.");
		 
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
		throw  new Error("The table name or the SQL expression should be specified.");
		 
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

		var  //stemp = exports.sqlTemplate(schema.title),
			 stemp = exports.sql(tbName),	// how about 'table as alias'
			 columns = Object.keys(schema.columns),
			 op = options.op;

		if (options.expr.table.join)
			stemp.value().table.join = options.expr.table.join;
		
		if (data || op === 'query' || op === 'list')
			stemp.column( options.expr.columns  ?  options.expr.columns : columns );

		if (query)  {
			if (options.expr.filters)
				stemp.filter( options.expr.filters );
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

		stemp.extra( options.expr.extra );

		var  cmd = {op: op, expr: stemp.value(), range: options.range, conn: options.conn, debug: options.debug};
		runTemplate({dbName: dbName, tbName: tbName}, cmd, data, query, handler);
	});
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


function  runTemplate(tableLoc, options, data, query, handler)  {
	var  p = [],
		 sql = getJsonSqlGenerator().toSQL(options, data, query, p);

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
						conn.release();

						if (err)
							handler( err );
						else  {
							if (options.op === 'insert')
								returnInsert(tableLoc, data, value, handler);
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


function  retrieveFilter(input, query)  {
	if (Object.keys(input).length === 0)
		return  null;

	var  filters = [];
	
	for (var key in input)  {
		if (typeof input[key] === 'object')  {
			var  f,
				 kv = input[key];
			if (kv.op && kv.hasOwnProperty('value'))  {
				f = {name: key, op: kv.op};
				query[key] = kv.value;
			}
			else  {
				f = {name: key, op: '='},
				query[key] = JSON.stringify(kv);
			}
			filters.push(f);
		}
		else  {
			var  f = {name: key, op: '='};
			filters.push( f );
			
			query[key] = input[key];
		}
	}
	
	if (filters.length > 1)
		return  {op: 'and', filters: filters};

	return  filters[0];
};


function  getJsonSqlGenerator()  {
	return  sqlGen;
}


exports.setDebug = function  setDebug(b)  {
	getJsonSqlGenerator().setDebug( b );
};