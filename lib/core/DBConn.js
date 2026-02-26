/**
 * core/DBConn.js
 * @author: Ben Lue
 * @copyright: 2023 ~ 2025 Conwell Inc.
 */
'use strict';

const  SchemaManager = require('../schemaManager.js');

class DBConn {

    constructor(dbConfig)  {
        if (!dbConfig)
            throw new Error('Cannot find database configuration');

        // Set up common properties
        let dbName = dbConfig.alias || dbConfig.database;
        this.name = dbName;
        this.dbConfig = dbConfig;
        this.pool = null; // Will be set by subclasses

        this.schemaCache = {}      // cache the table schemas
        this.formulaXformer = {}
    }

    
    get databaseType()  {
        throw new Error('databaseType() method must be implemented by subclass');
    }


    getFormulaXFormer(fname)  {
        return  this.formulaXformer[fname];
    }


    // Abstract method - must be implemented by subclasses
    async connect()  {
        throw new Error('connect() method must be implemented by subclass');
    }


    async getTableSchema(tbName)  {
        // watch out for table alias
        let  tableName = tbName.trim().split(' ')[0],
             schema = this.schemaCache[tableName];

        if (schema)  {
            console.log('using cached schema for ' + tableName);
            return  schema;
        }

        const  conn = await this.connect();
        try  {
            schema = await this.schemaManager.describeTable(conn, tableName);
            this.schemaCache[tableName] = schema;
            return  schema;
        }
        finally  {
            conn.release();
        }
    }


    // Abstract method - must be implemented by subclasses
    async closeDown()  {
        throw new Error('closeDown() method must be implemented by subclass');
    }
}

module.exports = DBConn;