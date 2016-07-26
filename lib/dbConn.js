/*!
* sql-soar
* authors: Ben Lue
* license: MIT License
* Copyright(c) 2015 Gocharm Inc.
*/
var  fs = require('fs'),
	 mysql = require('mysql');

var  dbConn = (function() {
	var  dbConn = function(options)  {
		this.name = options.database;
		
		this.pool = mysql.createPool( options );

		this.getConnection = function(handler)  {
			try  {
				this.pool.getConnection( handler );
			}
			catch (e)  {
				//consol.log( e.stack );
				handler( e );
			}
		};

		this.closeDown = function(callback) {
			this.pool.end( callback );
		};
	};

	return  dbConn;
})();

module.exports = dbConn;
