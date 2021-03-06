/*!
* sql-soar
* authors: Ben Lue
* license: MIT License
* Copyright(c) 2015~2016 Gocharm Inc.
*/
var  util = require('util');

var  _debug = false,
	 _NL = ' ',
	 _noArgOP = ['IS NOT NULL', 'IS NULL'];

/* turn on/off debug */
exports.setDebug = function setDebug(b)  {
	_NL = (_debug = b)  ?  '\n' : ' ';
};


exports.createTable = function(schema)  {
	var  debug = _debug || schema.debug,
		 sql = util.format('CREATE TABLE %s\n(\n', schema.title);
		 
	for (var i in schema.columns)  {
		var  c = schema.columns[i],
			 s = util.format('  %s\t\t%s', c.title, c.type);

		if (c.options)  {
			var  opt = c.options;
			if (opt.notNull)
				s += ' NOT NULL';
			if (opt.hasOwnProperty('default'))
				s += ' DEFAULT ' + opt.default;
			if (opt.autoInc)
				s += ' AUTO_INCREMENT';
			if (opt.comment)
				s += " COMMENT '" + opt.comment + "'";
		}
		sql += s + ',\n'
	}

	sql += '  primary key (';
	var  pk = '';
	for (var i in schema.primary)  {
		if (i > 0)
			pk += ', ';
		pk += schema.primary[i];
	}
	sql += pk + ')\n)';

	// adding table options
	var  opts = '';
	if (schema.options)  {
		var  opt = schema.options;
		for (var k in opt)  {
			if (opts)
				opts += ' ';
			if (k === 'comment')
				opts += "COMMENT = '" + opt.comment + "'";
			else
				opts += k + ' = ' + opt[k];
		}
	}

	if (opt)
		sql += '\n' + opts + ';';
	else
		sql += ';';

	if (debug)
		console.log('SQL[Create table]-----\n' + sql);
	return  sql;
};


exports.alterTable = function(schema)  {
	var  sql = util.format('ALTER TABLE %s\n', schema.title),
		 alterSpec,
		 debug = _debug || schema.debug;

	if (schema.add)  {
		if (schema.add.column)  {
			var  columns = schema.add.column;
			for (var i in columns)  {
				var  c = columns[i],
					 s = util.format('ADD COLUMN %s\t%s', c.title, c.type);

				if (c.options)  {
					var  opt = c.options;
					if (opt.notNull)
						s += ' NOT NULL';
					if (opt.hasOwnProperty('default'))
						s += ' DEFAULT ' + opt.default;
					if (opt.autoInc)
						s += ' AUTO_INCREMENT';
					if (opt.comment)
						s += " COMMENT '" + opt.comment + "'";
				}
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			}
		}

		if (schema.add.index)  {
			var  indexes = schema.add.index;
			for (var key in indexes)  {
				var  idx = indexes[key],
					 isUnique = idx.unique  ?  ' UNIQUE' : '';

				var  idxSQL = '';
				for (var i in idx.columns)  {
					if (idxSQL)
						idxSQL += ', ' + idx.columns[i];
					else
						idxSQL = idx.columns[i];
				}

				var  s = util.format('ADD%s INDEX %s (%s)', isUnique, key, idxSQL);
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			}
		}

		if (schema.add.foreignKey)  {
			var  fkeys = schema.add.foreignKey;
			for (var key in fkeys)  {
				var  fk = fkeys[key],
					 delInt = 'restrict',
					 updInt = 'restrict',
					 reference = fk.reference;

				if (fk.integrity)  {
					delInt = fk.integrity.delete || delInt;
					updInt = fk.integrity.update || updInt;
				}

				var  idx = reference.indexOf('.'),
					 refTable = reference.substring(0, idx),
					 refCol = reference.substring(idx+1),
					 s = util.format('ADD CONSTRAINT %s FOREIGN KEY (%s) references %s (%s) ON DELETE %s ON UPDATE %s', key, fk.key, refTable, refCol, delInt, updInt);
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			}
		}
	}
	
	if (schema.alter)  {
		if (schema.alter.column)  {
			var  columns = schema.alter.column;
			for (var i in columns)  {
				var  c = columns[i],
					 s;
				
				if (c.name)
					s = util.format('CHANGE COLUMN `%s` `%s` %s', c.title, c.name, c.type);
				else
					s = util.format('MODIFY COLUMN `%s` %s', c.title, c.type);
				
				if (s)	{
					if (alterSpec)
						alterSpec += ',\n' + s;
					else
						alterSpec = s;
				}
			}
		}
	}

	if (schema.drop)  {
		if (schema.drop.column)  {
			var  columns = schema.drop.column;
			for (var i in columns)  {
				var  s = 'DROP COLUMN ' + columns[i];
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			}
		}

		if (schema.drop.index)  {
			var  indexes = schema.drop.index;
			for (var i in indexes)  {
				var  s = 'DROP INDEX ' + indexes[i];
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			}
		}

		if (schema.drop.foreignKey)  {
			var  keys = schema.drop.foreignKey;
			for (var i in keys)  {
				var  s = 'DROP FOREIGN KEY ' + keys[i];
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			}
		}
	}

	sql += alterSpec + ';';

	if (debug)
		console.log('SQL[Alter table]-----\n' + sql);
	return  sql;
};


exports.toSQL = function(options, data, query, p)  {
	var  sql,
		 op = options.op,
		 expr = options.expr,
		 fld = options.fields,
		 debug = options.debug || _debug;

	switch (op)  {
		case 'query':
			sql = genQuery(expr, query, p, fld, debug);
			break;

		case 'list':
			var  range = options.range;
			sql = genList(expr, query, p, range, fld, debug);
			break;
			
		case  'listCount':
			sql = genListCount();
			break;

		case 'insert':
			sql = genInsert(expr, data, p, debug);
			break;

		case 'update':
			sql = genUpdate(expr, data, query, p, debug);
			break;

		case 'delete':
			sql = genDelete(expr, query, p, debug);
			break;
	}
	return  sql;
};


function  genQuery(expr, q, p, fld, debug)  {
	var  sql = composeQ(expr, q, p, fld, false, debug);
	if (sql.length > 0)
		sql += _NL + 'LIMIT 1;';
	else
		sql += ';';

	return  sql;
};


function genList(expr, q, p, range, fields, debug)  {
	var  isGetCount = range  ?  true : false,
		 sql = composeQ( expr, q, p, fields, isGetCount, debug );
	if (sql) {
		if (range)
			sql += _NL + 'LIMIT ' + range.getIndex() + ', ' + range.getPageSize() + ';';
		else
			sql += ';';
	}

	return  sql;
};


function genInsert(expr, data, p, debug)  {
	if (!data)
		throw  new Error('Missing insert data');

	var  tableSpec = rectifyTable(expr.table, true),
		 fields = expr.columns;
		 
	if (expr.table.join)
		fields = mainTableColumn(tableSpec, fields);

	var  sql = 'INSERT INTO `' + tableSpec.table + '` (`',
		 notFirst = false;
	fields.forEach( function(f) {
		if (data.hasOwnProperty(f))  {
			if (notFirst)
				sql += '`, `';
			sql += f;
			notFirst = true;

			p.push( data[f] );
		}
	});

	sql += '`) VALUES (?';
	for (var i = 1, len = p.length; i < len; i++)
		sql += ', ?';
	sql += ');';

	if (debug)  {
		console.log('SQL-----\n' + sql);
		console.log('Arguments:\n' + p);
	}

	return  sql;
};


function genUpdate(expr, data, terms, p, debug)  {
	if (!data)
		throw  new Error('Missing update data');

	var  tableSpec = rectifyTable( expr.table, true ),
		 fields = expr.columns;
		 
	if (expr.table.join)
		fields = mainTableColumn(tableSpec, fields);

	var  sql = util.format('UPDATE `%s`%sSET `', tableSpec.table, _NL),
		 notFirst;
	fields.forEach( function(f) {
		if (data.hasOwnProperty(f))  {
			if (notFirst)
				sql += ', `';
			sql += f + '`=?';
			notFirst = true;

			p.push( data[f] );
		}
	});

	// where...
	var  filter = expr.table.join  ?  mainTableFilter(tableSpec, expr.filters) : expr.filters;
	if (filter)  {
		var  s = matchFilter(filter, terms, p);
		if (s.length > 0)
			sql += _NL + 'WHERE ' + s;
	}
	sql += ';';

	if (debug)  {
		console.log('SQL-----\n' + sql);
		console.log('Arguments:\n' + p);
	}

	return  sql;
};


function genDelete(expr, terms, p, debug)  {
	var  tableSpec = rectifyTable( expr.table, true ),
		 sql = util.format('DELETE FROM `%s`', tableSpec.table);

	// where...
	var  filter = expr.table.join  ?  mainTableFilter(tableSpec, expr.filters) : expr.filters;
	if (filter !== null)  {
		var  s = matchFilter(filter, terms, p);
		if (s.length > 0)
			sql += _NL + 'WHERE ' + s;
	}
	sql += ';';

	if (debug)  {
		console.log('SQL-----\n' + sql);
		console.log('Arguments:\n' + p);
	}

	return  sql;
};


function  genListCount()  {
	return  'SELECT FOUND_ROWS() AS ct;';
}


function composeQ(expr, q, p, fld, isGetCount, debug)  {
	let  table = expr.table,
		 fields = expr.columns,
		 sql = 'SELECT ',
		 notFirst = false

	if (isGetCount)
		sql += 'SQL_CALC_FOUND_ROWS '

	if (fld)
		// pick up only selected fields
		fields.forEach( function(f)  {
			if (fld.indexOf(f) >= 0)  {
				if (notFirst)
					sql += ', ';
				else
					notFirst = true;

				sql += f;
			}
		});
	else
		fields.forEach( function(f) {
			if (notFirst)
				sql += ', ';
			else
				notFirst = true;

			sql += f;
		});

	// from...
	sql += _NL + 'FROM ' + rectifyTable(table)

	// join...
	sql = genJoin(sql, table)

	// where...
	let  filter = expr.filters;
	if (filter)  {
		const  s = matchFilter(filter, q, p)
		if (s.length > 0)
			sql += _NL + 'WHERE ' + s
	}

	// extra
	if (expr.extra)
		sql += _NL + expr.extra

	if (debug)  {
		console.log('SQL-----\n' + sql)
		console.log('Arguments:\n' + p)
	}

	return  sql
};


/**
 * Generated the JOIN statement
 * @param {*} sql the SQL statment that has been generated thus far.
 * @param {*} table the table schema
 */
function  genJoin(sql, table)  {
	if (table.join)  {
		table.join.forEach( function(jt) {
			sql += _NL;
			if (jt.type)
				sql += ' ' + jt.type + ' ';
			sql += 'JOIN ' + jt.table;

			if (jt.use)
				sql += ' USING(`' + jt.use + '`)';
			else  {
				var  onWhat = jt.on || jt.onWhat;
				if (onWhat.indexOf('=') < 0)  {
					// this is a short form as x.field, and we'll make it to x.field=y.field
					var  idx = onWhat.indexOf('.');

					// TODO: missing the syntax error handling
					if (idx > 0)  {
						var  jfield = onWhat.substring(idx),
							 tbName = rectifyTable({name: jt.table}, true);
						onWhat += '=' + (tbName.alias || tbName.table) + jfield;
					}
				}
				sql += ' ON ' + onWhat;
			}
		});
	}
	return  sql;
}


function  mainTableColumn(tableSpec, fields)  {
	var  nf = [];
	fields.forEach( function(f) {
		var  idx = f.indexOf('.');
		if (idx > 0)  {
			// filter out columns from other tables
			var  tbName = f.substring(0, idx);
			if (tbName === tableSpec.alias || tbName === tableSpec.table)
				nf.push( f.substring(idx+1) );
		}
	});
	
	return  nf;
}


/**
 * remove all query terms not applicable to the main table
 */
function  mainTableFilter(tableSpec, filter)  {
	var  op = filter.op;

	if (op === 'AND' || op === 'and' || op === 'OR' || op === 'or')  {
		var  nfilters = [];

		filter.filters.forEach(function(f)  {
			var  mf = mainTableFilter(tableSpec, f);
			if (mf)
				nfilters.push( mf );
		});
		
		if (nfilters.length)  {
			if (nfilters.length === 1)
				return  nfilters[0];
				
			return  {op: op.toUpperCase(), filters: nfilters};
		}
		return  null;
	}

	var  fname = filter.name,
		 idx = fname.indexOf('.');

	if (idx > 0)  {
		var  alias = fname.substring(0, idx);
		if (alias !== tableSpec.alias && alias !== tableSpec.table)
			return  null;
			
		fname = fname.substring(idx+1);
	}
	
	return  {op: op, name: fname};
};


/**
 * q: input query parameter
 * p: the produced parameters for the prepared statement
 */
function  matchFilter(filter, q, p)  {
	// let's deal with the short cut first
	if (typeof filter === 'string')
		filter = {name: filter, op: '='};
	else  if (Array.isArray(filter))
		filter = {op: 'AND', filters: filter}
	else  if (Object.getOwnPropertyNames(filter).length === 1)  {
		var  key = Object.keys(filter)[0],
			 fvalue = filter[key];

		if (Array.isArray(fvalue))  {
			filter.filters = fvalue;
			filter.op = key;
			delete  filter[key];
		}
		else  {
			var  nf = {
					name: key,
					op: fvalue
				 };
			filter = nf;
		}
	}
	// console.log('filter is:\n' + JSON.stringify(filter, null, 4));
	
	// now we're ready to roll...
	var  op = filter.op,
		 sql = '';

	if (op === 'AND' || op === 'and' || op === 'OR' || op === 'or')  {
		var  hit = false;
		op = op.toUpperCase();

		filter.filters.forEach(function(f)  {
			var  s = matchFilter(f, q, p);
			if (s)  {
				sql = sql  ?  util.format('%s %s %s', sql, op, s) : s;
				hit = true;
			}
		});
		if (hit)
			sql = '(' + sql + ')';
	}
	else  {
		var  fname = filter.name,
			 idx = fname.indexOf('.');

		if (idx > 0)
			fname = fname.substring(idx+1);

		if (q.hasOwnProperty(fname))  {
			sql = filter.field || filter.name;
			if (op)  {
				sql += ' ' + op;
				
				if (op === 'in' || op === 'IN')  {
					var  para = q[fname];
					if (Object.prototype.toString.call(para) === '[object Array]' && para.length) {
						sql += ' (';
						for (var i in para)  {
							if (i > 0)	sql += ', ';
							sql += '?';
							
							p.push(para[i]);
						}
						sql += ')';
					}
					else
						throw 'Parameters for the IN clause should be a non-empty array';
				}
				else  if (_noArgOP.indexOf(op) < 0)  {
					if (!filter.noArg)  {
						p.push( q[fname] );
						sql += ' ?';
					}
				}
			}
			else  {
				p.push( q[fname] );
				//sql += '=?';
			}
		}
	}

	return  sql;
}


function  rectifyTable(table, fullSpec)  {
	var  tbName = table.name;
	var  idx = tbName.indexOf('.');
	if (idx > 0)
		tbName = tbName.substring(idx+1);
		 
	if (fullSpec)  {
		var  spec = {},
			 idx0 = tbName.indexOf(' ');
			 
		if (idx0 > 0)  {
			var  parts = tbName.split(' ');
			tbName = parts[0];
			if (parts.length === 3)
				spec.alias = parts[2];
			else
				spec.alias = parts[1];
		}
		else
			spec.alias = tbName;
		
		spec.table = tbName;	
		return  spec;
	}
	
	return  tbName;
}