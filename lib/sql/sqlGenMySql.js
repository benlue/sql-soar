/**
 * SQL statement generator for MySQL
 * @author Ben Lue
 * @copyright 2023 ~ 2025 Conwell Inc.
*/
var  _debug = false,
	 _NL = ' ',
	 _noArgOP = ['IS NOT NULL', 'IS NULL'];

/* turn on/off debug */
exports.setDebug = function setDebug(b)  {
	_NL = (_debug = b)  ?  '\n' : ' ';
};


exports.createTable = function(schema)  {
	let  debug = _debug || schema.debug,
		 sql = `CREATE TABLE ${schema.title}\n(\n`;
		 
	schema.columns.forEach( c => {
		let  s = `  ${c.title}\t\t${c.type}`;

		if (c.options)  {
			const  opt = c.options;
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
	})

	sql += '  primary key (';
	let  pk = '';
	for (let i in schema.primary)  {
		if (i > 0)
			pk += ', ';
		pk += schema.primary[i];
	}
	sql += pk + ')\n)';

	// adding table options
	let  opts = '';
	if (schema.options)  {
		const  opt = schema.options;
		for (let k in opt)  {
			if (opts)
				opts += ' ';
			if (k === 'comment')
				opts += "COMMENT = '" + opt.comment + "'";
			else
				opts += k + ' = ' + opt[k];
		}
	}

	if (opts)
		sql += '\n' + opts + ';';
	else
		sql += ';';

	if (debug)
		console.log('SQL[Create table]-----\n' + sql);
	return  sql;
};


exports.alterTable = function(schema)  {
	let  sql = `ALTER TABLE ${schema.title}\n`,
		 alterSpec,
		 debug = _debug || schema.debug;

	if (schema.add)  {
		if (schema.add.column)  {
			const  columns = schema.add.column;
			columns.forEach( c => {
				let  s = `ADD COLUMN ${c.title}\t${c.type}`;

				if (c.options)  {
					const  opt = c.options;
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
			})
		}

		if (schema.add.index)  {
			const  indexes = schema.add.index;
			for (let key in indexes)  {
				const  idx = indexes[key],
					   isUnique = idx.unique  ?  ' UNIQUE' : '';

				let  idxSQL = '';
				for (let i in idx.columns)  {
					if (idxSQL)
						idxSQL += ', ' + idx.columns[i];
					else
						idxSQL = idx.columns[i];
				}

				const  s = `ADD${isUnique} INDEX ${key} (${idxSQL})`;
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			}
		}

		if (schema.add.foreignKey)  {
			const  fkeys = schema.add.foreignKey;
			for (let key in fkeys)  {
				let  fk = fkeys[key],
					 delInt = 'restrict',
					 updInt = 'restrict',
					 reference = fk.reference;

				if (fk.integrity)  {
					delInt = fk.integrity.delete || delInt;
					updInt = fk.integrity.update || updInt;
				}

				const  idx = reference.indexOf('.'),
					   refTable = reference.substring(0, idx),
					   refCol = reference.substring(idx+1),
					   s = `ADD CONSTRAINT ${key} FOREIGN KEY (${fk.key}) references ${refTable} (${refCol}) ON DELETE ${delInt} ON UPDATE ${updInt}`;
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			}
		}
	}
	
	if (schema.alter)  {
		if (schema.alter.column)  {
			const  columns = schema.alter.column;
			columns.forEach( c => {
				let  s;
				
				if (c.name)
					s = `CHANGE COLUMN \`${c.title}\` \`${c.name}\` ${c.type}`;
				else
					s = `MODIFY COLUMN \`${c.title}\` ${c.type}`;
				
				if (s)	{
					if (alterSpec)
						alterSpec += ',\n' + s;
					else
						alterSpec = s;
				}
			});
		}
	}

	if (schema.drop)  {
		if (schema.drop.column)  {
			const  columns = schema.drop.column;
			columns.forEach( c => {
				const  s = `DROP COLUMN \`${c}\``;
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			});
		}

		if (schema.drop.index)  {
			const  indexes = schema.drop.index;
			indexes.forEach( i => {
				const  s = `DROP INDEX ${i}`;
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			})
		}

		if (schema.drop.foreignKey)  {
			const  keys = schema.drop.foreignKey;
			keys.forEach( k => {
				const  s = `DROP FOREIGN KEY ${k}`;
				if (alterSpec)
					alterSpec += ',\n' + s;
				else
					alterSpec = s;
			})
		}
	}

	sql += alterSpec + ';';

	if (debug)
		console.log('SQL[Alter table]-----\n' + sql);
	return  sql;
};


exports.toSQL = function(cmd, data, query, p)  {
	const  expr = cmd.expr,
		   debug = cmd.debug || _debug;
	let  sql;
	
	switch (cmd.op)  {
		case 'query':
			sql = genQuery(expr, query, p, debug);
			break;

		case 'list':
			sql = genList(cmd, query, p, debug);
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


function  genQuery(expr, q, p, debug)  {
	let  sql = composeQ(expr, q, p, false, debug);
	if (sql.length > 0)
		sql += _NL + 'LIMIT 1;';
	else
		sql += ';';

	return  sql;
};


function genList(cmd, q, p, debug)  {
	const  expr = cmd.expr,
		   range = cmd.range,
	       isGetCount = range  ?  true : false

	let  sql = composeQ( expr, q, p, isGetCount, debug )

	if (sql) {
		if (isGetCount)
			sql += _NL + 'LIMIT ' + range.getIndex() + ', ' + range.getPageSize() + ';';
		else
			sql += ';';
	}

	return  sql;
};


function genInsert(expr, data, p, debug)  {
	if (!data)
		throw  new Error('Missing insert data');

	const  tableSpec = rectifyTable(expr.table, true),
		   fields = expr.table.join  ?  mainTableColumn(tableSpec, expr.columns) : expr.columns

	let  sql = 'INSERT INTO `' + tableSpec.table + '` (`',
		 notFirst = false;
	fields.forEach( function(f) {
		if (data.hasOwnProperty(f))  {
			if (notFirst)
				sql += '`, `';
			sql += f;
			notFirst = true

			p.push( data[f] );
		}
	});

	sql += '`) VALUES (?';
	for (let i = 1, len = p.length; i < len; i++)
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

	const  tableSpec = rectifyTable( expr.table, true ),
		   fields = expr.table.join  ?  mainTableColumn(tableSpec, expr.columns) : expr.columns;
		 
	// if (expr.table.join)
	// 	fields = mainTableColumn(tableSpec, fields);

	let  sql = `UPDATE \`${tableSpec.table}\`${_NL}SET \``,
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
	const  filter = expr.table.join  ?  mainTableFilter(tableSpec, expr.filters) : expr.filters;
	if (filter)  {
		const  s = matchFilter(filter, terms, p);
		if (s)
			sql += `${_NL}WHERE ${s}`
	}
	sql += ';'

	if (debug)  {
		console.log('SQL-----\n' + sql);
		console.log('Arguments:\n' + p);
	}

	return  sql;
};


function genDelete(expr, terms, p, debug)  {
	let  tableSpec = rectifyTable( expr.table, true ),
		 sql = `DELETE FROM \`${tableSpec.table}\``;

	// where...
	const  filter = expr.table.join  ?  mainTableFilter(tableSpec, expr.filters) : expr.filters;
	if (filter)  {
		const  s = matchFilter(filter, terms, p);
		if (s)
			sql += `${_NL}WHERE ${s}`
	}
	sql += ';'

	if (debug)  {
		console.log('SQL-----\n' + sql);
		console.log('Arguments:\n' + p);
	}

	return  sql;
};


function  genListCount()  {
	return  'SELECT FOUND_ROWS() AS ct;';
}


function  composeQ(expr, q, p, isGetCount, debug)  {
	let  table = expr.table,
		 fields = expr.columns,
		 sql = 'SELECT ',
		 notFirst = false

	if (isGetCount)
		sql += 'SQL_CALC_FOUND_ROWS '

	/*
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
	*/
		fields.forEach( f => {
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
		const  s = matchFilter(filter, q, p);
		if (s)
			sql += `${_NL}WHERE ${s}`
	}

	// order by
	if (expr.orderBy)
		sql += _NL + genOrderBy(expr.orderBy)

	// extra
	if (expr.extra)
		sql += _NL + expr.extra

	if (debug)  {
		console.log('SQL-----\n' + sql)
		console.log('Arguments:\n' + p)
	}

	return  sql
};


function  genOrderBy(orderBy)  {
	let  sql = 'ORDER BY ',
		 notFirst = false;

	orderBy.forEach(item => {
		if (notFirst)
			sql += ', ';
		else
			notFirst = true;

		if (typeof item === 'string')
			sql += `${item} ASC`;
		else  {
			const  col = Object.keys(item)[0],
				   dir = item[col].toUpperCase();
			sql += `${col} ${dir}`;
		}
	});

	return  sql;
}


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
	let  nf = [];
	fields.forEach( f => {
		const  idx = f.indexOf('.');
		if (idx > 0)  {
			// filter out columns from other tables
			const  tbName = f.substring(0, idx);
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
	const  op = filter.op.toUpperCase();

	if (op === 'AND' || op === 'OR')  {
		const  nfilters = [];

		filter.filters.forEach(f => {
			const  mf = mainTableFilter(tableSpec, f);
			if (mf)
				nfilters.push( mf );
		});
		
		if (nfilters.length)  {
			if (nfilters.length === 1)
				return  nfilters[0];
				
			return  {op: op, filters: nfilters};
		}
		return  null;
	}

	let  fname = filter.name,
		 idx = fname.indexOf('.');

	if (idx > 0)  {
		const  alias = fname.substring(0, idx);
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
		const  key = Object.keys(filter)[0],
			   fvalue = filter[key];

		if (Array.isArray(fvalue))  {
			filter.filters = fvalue;
			filter.op = key;
			delete  filter[key];
		}
		else  {
			const  nf = {
							name: key,
							op: fvalue
						};
			filter = nf;
		}
	}
	// console.log('filter is:\n' + JSON.stringify(filter, null, 4));
	
	// now we're ready to roll...
	let  op = filter.op.toUpperCase(),
		 sql = '';

	if (op === 'AND' || op === 'OR')  {
		let  hit = false;

		filter.filters.forEach(function(f)  {
			const  s = matchFilter(f, q, p);
			if (s)  {
				sql = sql  ?  `${sql} ${op} ${s}` : s;
				hit = true;
			}
		});
		if (hit)
			sql = '(' + sql + ')';
	}
	else  {
		let  fname = filter.name,
			 idx = fname.indexOf('.');

		if (idx > 0)
			fname = fname.substring(idx+1);

		if (q.hasOwnProperty(fname))  {
			sql = filter.field || filter.name;
			if (op)  {
				sql += ' ' + op;

				if (op === 'IN')  {
					const  para = q[fname];
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
						const  value = q[fname];
						// Check if value starts with @ for column reference
						if (typeof value === 'string' && value.startsWith('@'))  {
							// Remove @ and use as column name (no parameter)
							sql += ' ' + value.substring(1);
						}
						else  {
							// Normal parameter handling
							p.push( value );
							sql += ' ?';
						}
					}
				}
			}
			else  {
				const  value = q[fname];
				// Check if value starts with @ for column reference
				if (typeof value === 'string' && value.startsWith('@'))  {
					// For cases without explicit operator, treat as equality with column reference
					sql += ' = ' + value.substring(1);
				}
				else  {
					// For cases without explicit operator, treat as equality with parameter
					sql += ' = ?';
					p.push( value );
				}
			}
		}
	}

	return  sql;
}


function  rectifyTable(table, fullSpec)  {
	let  tbName = table.name,
		 idx = tbName.indexOf('.');
	if (idx > 0)
		tbName = tbName.substring(idx+1);
		 
	if (fullSpec)  {
		let  spec = {},
			 idx0 = tbName.indexOf(' ');
			 
		if (idx0 > 0)  {
			const  parts = tbName.split(' ');
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