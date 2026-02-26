/**
 * soar.js
 * authors: Ben Lue
 * Copyright(c) 2023 ~ 2026
 */
const  dbm = require('./core/DBManager.js'),
	   engine = require('./core/sqlEngine'),
	   sqlComp = require('./sql/sqlComp.js'),
	   SchemaManagerMySQL = require('./mysqlSchemaManager.js'),
	   SchemaManagerPostgreSQL = require('./postgreSchemaManager.js');

const  DEF_PAGE_SIZE = 20,
	   _noArgOP = ['IS NOT NULL', 'IS NULL'];


exports.config = function(options)  {
	dbm.init(options);
};


let  Range = (function() {

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
}


exports.sql = function(tableName)  {
	return  new sqlComp(tableName);
}


exports.getConnection = function(dbName, handler)  {
	if (!handler)  {
		handler = dbName;
		dbName = null;
	}

	dbm.getConnection(dbName, handler);
}


/**
 * This function is polyformed as:
 *   runSql(dbName, sql, p, cb)
 *   runSql(conn, sql, p, cb)
 *   runSql(sql, p, cb)
 * which means the first parameter can be a database name string or a database connection object
 * @param {*} dbName 
 * @param {*} sql 
 * @param {*} p 
 * @param {*} cb 
 */
exports.runSql = function(dbName, sql, p, cb)  {
	if (arguments.length < 3)
		return  cb( new Error("Wrong parameters") );
		
	if (arguments.length < 4)  {
		cb = p;
		p = sql;
		sql = dbName;
		dbName = dbm.getDefaultDBName();
	}
	//console.log('runSql: dbName is %s, typeof dbName is %s', dbName, (typeof dbName));

	if (typeof dbName === 'string')
		dbm.getConnection(dbName, (err, conn) => {
			if (err)
				cb( err );
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


function  getSchemaManager() {
	return  dbm.getDatabaseType() === 'postgresql' ?  new SchemaManagerPostgreSQL() : new SchemaManagerMySQL();
}


exports.insert = function(tbName, data, cb)  {
	const  sql = exports.sql(tbName),
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
		 
	const  cmd = {
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
 * Execute a SQL statement which is defined in the 'expr' JSON object.
 * Short-hand format:
 *   execute(cmd, handler)
 *   execute(cmd, data, handler) when 'insert' or
 *   execute(cmd, query, handler) for other operations
 */
exports.execute = function(cmd, data, query, handler)  {
	cmd = shortCommand(cmd);

	switch (arguments.length)  {
		case  2:
			handler = data;
			data = cmd.data;
			query = cmd.query;
			break;

		case  3:
			handler = query;
			if (cmd.op == 'insert')
				query = null;
			else  {
				query = data;
				data = null;
			}
			break;
	}
	query = query || {};

	if (!cmd.expr || !cmd.op)
		return  handler( new Error('The command is missing the sql expression or operator.') );

	engine.execute(cmd, data, query, handler);
}


/**
 * support the short format of a soar command
 * @param {*} cmd 
 */
function  shortCommand(cmd)  {
	let  ncmd = {...cmd}

	if (!cmd.op)  {
		if (cmd.query)  {
			ncmd.op = 'query';
			ncmd.expr = cmd.query;

			delete  ncmd.query;
		}
		else  if (cmd.list)  {
			ncmd.op = 'list';
			ncmd.expr = cmd.list;

			delete  ncmd.list;
		}
		else  if (cmd.update)  {
			ncmd.op = 'update';
			ncmd.expr = cmd.update;

			delete  ncmd.update;
		}
		else  if (cmd.insert)  {
			ncmd.op = 'insert';
			ncmd.expr = cmd.insert;

			delete  ncmd.insert;
		}
		else  if (cmd.delete)  {
			ncmd.op = 'delete';
			ncmd.expr = cmd.delete;

			delete  ncmd.delete;
		}
	}

	return  ncmd
}


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
}