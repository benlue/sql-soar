/**
 * core/DBConnPostgreSQL.js
 * authors: Ben Lue
 * Copyright(c) 2023 ~ 2025 Conwell Inc.
 */
'use strict';

const  { Pool } = require('pg'),
       PostgreSQLSchemaManager = require('../postgreSchemaManager.js'),
       DBConn = require('./DBConn');


class DBConnPostgreSQL extends DBConn {

    constructor(dbConfig)  {
        super(dbConfig)

        // Database specific schema manager
        this.schemaManager = new PostgreSQLSchemaManager()
        
        // Map MySQL-style config to PostgreSQL Pool options
        const  pgConfig = {...dbConfig}
        delete  pgConfig.type;
        
        // Map connectionLimit to PostgreSQL's max option
        if (pgConfig.connectionLimit) {
            pgConfig.max = pgConfig.connectionLimit;
            delete pgConfig.connectionLimit;
        }
        
        // Map minConnection to PostgreSQL's min option
        if (pgConfig.minConnection) {
            pgConfig.min = pgConfig.minConnection;
            delete pgConfig.minConnection;
        }
        
        // Handle SSL certificate file paths
        if (pgConfig.ssl && typeof pgConfig.ssl === 'object') {
            const ssl = pgConfig.ssl;
            
            // Read certificate files if they are file paths
            if (ssl.ca && typeof ssl.ca === 'string') {
                try {
                    ssl.ca = fs.readFileSync(ssl.ca, 'utf8');
                } catch (err) {
                    throw new Error(`Failed to read SSL CA certificate file: ${ssl.ca}. ${err.message}`);
                }
            }
            
            if (ssl.cert && typeof ssl.cert === 'string') {
                try {
                    ssl.cert = fs.readFileSync(ssl.cert, 'utf8');
                } catch (err) {
                    throw new Error(`Failed to read SSL client certificate file: ${ssl.cert}. ${err.message}`);
                }
            }
            
            if (ssl.key && typeof ssl.key === 'string') {
                try {
                    ssl.key = fs.readFileSync(ssl.key, 'utf8');
                } catch (err) {
                    throw new Error(`Failed to read SSL client key file: ${ssl.key}. ${err.message}`);
                }
            }
        }
        
        // Create PostgreSQL connection pool
        this.pool = new Pool(pgConfig);
    }


    get databaseType()  {
        return 'postgresql';
    }


    connect(cb)  {
        try  {
            this.pool.connect(cb);
        }
        catch (e)  {
            cb(e);
        }
    }

    
    closeDown(cb)  {
        // Clean up shared resources first
        this.schemaCache = null;
        this.formulaXformer = null;
        
        // PostgreSQL-specific pool cleanup
        this.pool.end(cb);
    }
}

module.exports = DBConnPostgreSQL;