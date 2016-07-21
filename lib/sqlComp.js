/*!
* sql-soar
* authors: Ben Lue
* license: MIT License
* Copyright(c) 2015 Gocharm Inc.
*/
var  sqlComp = (function()  {

	var  sqlComp = function(tableName) {
		this.schema = {
			id: generateId(),
			table: {
				name: tableName
			}
		};
	};

	sqlComp.prototype.join = function(joinExpr) {
		// do some checking
		if (!joinExpr.table)
			throw  new Error('Joined table name is missing');
		if (!joinExpr.use && !joinExpr.onWhat)
			throw  new Error('Missing join clause');

		if (!this.schema.table.join)
			this.schema.table.join = [];
		this.schema.table.join.push( joinExpr );

		return  this;
	};

	sqlComp.prototype.column = function(columns)  {
		if (Array.isArray(columns))  {
			for (var i in columns)  {
				var  field = columns[i];

				if (typeof field === 'object')  {
					// this column specification has a transformer associated with it
					var  cname = Object.getOwnPropertyNames(field)[0];

					this.schema.xformer = this.schema.xformer || {};
					this.schema.xformer[cname] = field[cname];
					columns[i] = cname;
				}
				else  if (typeof field !== 'string')
					throw  new Error('Some table columns are not in corret format.');
			}
			this.schema.columns = columns;
		}
		else  {
			if (typeof columns !== 'string')
				throw  new Error('The table column is not in corret format.');

			if (!this.schema.columns)
				this.schema.columns = [];
			this.schema.columns.push( columns );
		}

		return  this;
	};

	sqlComp.prototype.filter = function(filter)  {
		this.schema.filters = filter;
		return  this;
	};

	sqlComp.prototype.extra = function(extra)  {
		this.schema.extra = extra;
		return  this;
	};

	sqlComp.prototype.chainFilters = function(op, filters)  {
		return  {op: op, filters: filters};
	};

	sqlComp.prototype.value = function()  {
		return  this.schema;
	};

	return  sqlComp;
})();


/**
 * Borrowing from the jayson module
 */
function generateId() {
	return  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var  r = Math.random()*16|0,
			 v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

module.exports = sqlComp;
