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


exports.getConnection = async function(dbName)  {
	return  await dbm.getConnection(dbName || null);
}


/**
 * This function is polyformed as:
 *   runSql(target, sql, p) where target is a dbName string or a connection object
 *   runSql(sql, p)
 */
exports.runSql = async function(target, sql, p)  {
	if (arguments.length < 2)
		throw  new Error("Wrong parameters");

	if (arguments.length < 3)  {
		p = sql;
		sql = target;
		target = dbm.getDefaultDBName();
	}

	if (typeof target === 'string')  {
		const  conn = await dbm.getConnection(target);
		try  {
			const  result = await conn.query(sql, p);
			// mysql2/promise returns [rows, fields]; pg returns {rows, rowCount, ...}
			return  Array.isArray(result) ? result[0] : result;
		}
		finally  {
			conn.release();
		}
	}
	else  {
		// target is a connection object
		const  result = await target.query(sql, p);
		return  Array.isArray(result) ? result[0] : result;
	}
};


/**
 * Create a new table.
 * createTable(schema) or createTable(conn, schema)
 */
exports.createTable = async function(conn, schema)  {
	let  needRelease = false;

	if (schema === undefined)  {
		schema = conn;
		conn = await exports.getConnection();
		needRelease = true;
	}

	try  {
		return  await getSchemaManager().createTable(conn, schema);
	}
	finally  {
		if (needRelease)  conn.release();
	}
};


/**
 * alterTable(schema) or alterTable(conn, schema)
 */
exports.alterTable = async function(conn, schema)  {
	let  needRelease = false;

	if (schema === undefined)  {
		schema = conn;
		conn = await exports.getConnection();
		needRelease = true;
	}

	try  {
		return  await getSchemaManager().alterTable(conn, schema);
	}
	finally  {
		if (needRelease)  conn.release();
	}
};


/**
 * deleteTable(tbName) or deleteTable(conn, tbName)
 */
exports.deleteTable = async function(conn, tbName)  {
	let  needRelease = false;

	if (tbName === undefined)  {
		tbName = conn;
		conn = await exports.getConnection();
		needRelease = true;
	}

	try  {
		return  await getSchemaManager().deleteTable(conn, tbName);
	}
	finally  {
		if (needRelease)  conn.release();
	}
};


/**
 * renameTable(oldName, newName) or renameTable(conn, oldName, newName)
 */
exports.renameTable = async function(conn, oldName, newName)  {
	let  needRelease = false;

	if (newName === undefined)  {
		newName = oldName;
		oldName = conn;
		conn = await exports.getConnection();
		needRelease = true;
	}

	try  {
		return  await getSchemaManager().renameTable(conn, oldName, newName);
	}
	finally  {
		if (needRelease)  conn.release();
	}
};


/**
 * describeTable(tbName) or describeTable(conn, tbName)
 */
exports.describeTable = async function(conn, tbName)  {
	let  needRelease = false;

	if (tbName === undefined)  {
		tbName = conn;
		conn = await exports.getConnection();
		needRelease = true;
	}

	try  {
		return  await getSchemaManager().describeTable(conn, tbName);
	}
	finally  {
		if (needRelease)  conn.release();
	}
};


function  getSchemaManager() {
	return  dbm.getDatabaseType() === 'postgresql' ?  new SchemaManagerPostgreSQL() : new SchemaManagerMySQL();
}


exports.insert = async function(tbName, data)  {
	const  sql = exports.sql(tbName),
		   cmd = {
					op: 'insert',
					expr: sql
				};

	return  await exports.execute(cmd, data, null);
};


exports.query = async function(tbName, input)  {
	var  query = {},
		 filter = retrieveFilter(input, query),
		 sql;

	if (typeof tbName === 'string')
		sql = exports.sql(tbName).filter(filter);
	else  if (tbName.constructor == sqlComp)
		sql = tbName;
	else
		throw  new Error("The table name or the SQL expression should be specified.");

	const  cmd = {
			 op: 'query',
			 expr: sql
		 };

	return  await exports.execute(cmd, null, query);
};


exports.list = async function(tbName, input)  {
	var  query = {},
		 filter,
		 sql;

	if (input !== undefined)
		filter = retrieveFilter(input, query);

	if (typeof tbName === 'string')  {
		if (filter)
			sql = exports.sql(tbName).filter(filter);
		else
			sql = exports.sql(tbName);
	}
	else  if (tbName.constructor == sqlComp)
		sql = tbName;
	else
		throw  new Error("The table name or the SQL expression should be specified.");

	var  cmd = {
			 op: 'list',
			 expr: sql
		 };

	return  await exports.execute(cmd, null, query);
};


exports.update = async function(tbName, data, input)  {
	var  query = {},
		 filter = retrieveFilter(input, query);

	var  sql = exports.sql(tbName).filter(filter),
		 cmd = {
			 op: 'update',
			 expr: sql
		 };

	return  await exports.execute(cmd, data, query);
};


exports.del = async function(tbName, input)  {
	var  query = {},
		 filter = retrieveFilter(input, query);

	var  sql = exports.sql(tbName).filter(filter),
		 cmd = {
			 op: 'delete',
			 expr: sql
		 };

	return  await exports.execute(cmd, null, query);
};


/**
 * Execute a SQL statement which is defined in the 'expr' JSON object.
 * Polyformed as:
 *   execute(cmd)
 *   execute(cmd, data) when 'insert' or execute(cmd, query) for others
 *   execute(cmd, data, query)
 */
exports.execute = async function(cmd, data, query)  {
	cmd = shortCommand(cmd);

	switch (arguments.length)  {
		case  1:
			data = cmd.data;
			query = cmd.query;
			break;

		case  2:
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
		throw  new Error('The command is missing the sql expression or operator.');

	return  await engine.execute(cmd, data, query);
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
