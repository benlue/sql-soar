/*!
 * core/DBConn.js
 * authors: Ben Lue
 * Copyright(c) 2018 Gocharm Inc.
 */
'use strict';

const  fs = require('fs'),
       mysql = require('mysql'),
       path = require('path'),
       schMgr = require('../schemaManager.js');

class  DBConn {

    constructor(dbConfig)  {
        if (!dbConfig)
            throw  new Error('Cannot find database configuration');

        // first, set up db connection
        let  dbName = dbConfig.alias || dbConfig.database;
        this.name = dbName;
        this.pool = mysql.createPool( dbConfig );

        this.schemaCache = {},	    // cache the table schemas
        this.formulaSet = {},	    // SOAR definition files for every DB
	    this.formulaXformer = {};
    }


    getFormulaSet(fname)  {
        //console.log('formula: ' + fname);
        //console.log( JSON.stringify(this.formulaSet, null, 4));
        return  this.formulaSet[fname];
    }


    getFormulaXFormer(fname)  {
        return  this.formulaXformer[fname];
    }


    connect(cb)  {
        try  {
            this.pool.getConnection( cb );
        }
        catch (e)  {
            cb( e );
        }
    }


    getTableSchema(conn, tbName, cb)  {
        // watch out for table alias
        let  tableName = tbName.trim().split(' ')[0],
             schema = this.schemaCache[tableName];
    
        if (schema)
            cb( null, schema );
        else  if (conn)  {
            let schemaCache = this.schemaCache;
            schMgr.describeTable(conn, tableName, (err, schema) => {
                if (err)
                    cb(err);
                else  {
                    schemaCache[tableName] = schema;
                    cb(null, schema);
                }
            });
        }
        else  {
            let schemaCache = this.schemaCache;
            this.connect( (err, conn) => {
                if (err)
                    cb(err);
                else
                    schMgr.describeTable(conn, tableName, (err, schema) => {
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


    closeDown(cb)  {
        this.schemaCache = null;
        this.formulaSet = null;
	    this.formulaXformer = null;
        this.pool.end( cb );
    }
}

module.exports = DBConn;