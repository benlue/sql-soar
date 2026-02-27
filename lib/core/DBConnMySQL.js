/**
 * core/DBConnMySQL.js
 * authors: Ben Lue
 * Copyright(c) 2023 ~ 2025 Conwell Inc.
 */
'use strict';

const  mysql = require('mysql2/promise'),
       MySQLSchemaManager = require('../mysqlSchemaManager.js'),
       DBConn = require('./DBConn');

class DBConnMySQL extends DBConn {

    constructor(dbConfig)  {
        super(dbConfig)

        // Database specific schema manager
        this.schemaManager = new MySQLSchemaManager()
        
        // Create MySQL connection pool
        // Enhanced security config - mysql2 handles SSL file paths directly
        const secureConfig = { ...dbConfig };
        delete  secureConfig.type;
        this.pool = mysql.createPool(secureConfig)
    }


    get databaseType()  {
        return 'mysql';
    }


    async connect()  {
        const conn = await this.pool.getConnection();
        conn._dbType = 'mysql';
        return conn;
    }


    async closeDown()  {
        // Clean up shared resources first
        this.schemaCache = null;
        this.formulaXformer = null;

        // MySQL-specific pool cleanup
        await this.pool.end();
    }
}

module.exports = DBConnMySQL;