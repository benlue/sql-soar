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
    connect(cb)  {
        throw new Error('connect() method must be implemented by subclass');
    }


    getTableSchema(tbName, cb)  {
        // watch out for table alias
        let  tableName = tbName.trim().split(' ')[0],
             schema = this.schemaCache[tableName];
    
        if (schema)  {
            console.log('using cached schema for ' + tableName);
            cb( null, schema )
        }
        /*
        else  if (conn)  {
            const  schemaCache = this.schemaCache;
            this.schemaManager.describeTable(conn, tableName, (err, schema) => {
                if (err)
                    cb(err);
                else  {
                    schemaCache[tableName] = schema;
                    cb(null, schema);
                }
            });
        }
        */
        else  {
            const  schemaCache = this.schemaCache;
            this.connect( (err, conn) => {
                if (err)
                    cb(err);
                else
                    this.schemaManager.describeTable(conn, tableName, (err, schema) => {
                        conn.release();
    
                        if (err)
                            cb(err);
                        else  {
                            schemaCache[tableName] = schema;
                            cb(null, schema);
                        }
                    });
            });
        }
    }


    // Abstract method - must be implemented by subclasses
    closeDown(cb)  {
        cb(new Error('closeDown() method must be implemented by subclass'))
    }
}

module.exports = DBConn;