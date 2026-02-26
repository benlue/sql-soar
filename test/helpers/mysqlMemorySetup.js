/**
 * MySQL in-memory test setup using mysql-memory-server.
 * Downloads and runs a real MySQL binary as a child process.
 * No Docker/Podman needed.
 *
 * @author Ben Lue
 * @copyright 2025 ~ 2026 Conwell Inc.
 */
'use strict';

const  fs = require('fs'),
       path = require('path');

const  schemaPath = path.join(__dirname, '../sampleData/mysql/schema_memory.sql'),
       dataPath = path.join(__dirname, '../sampleData/mysql/sampleData.sql');

let  _promise = null;

/**
 * Create an in-memory MySQL database using mysql-memory-server.
 * The instance is cached — multiple calls return the same config.
 * Returns { config, stop } where config is soar-compatible.
 */
async function  createInMemoryMysqlConfig()  {
    if (!_promise)
        _promise = _initMysql();

    return  _promise;
}


async function  _initMysql()  {
    // mysql-memory-server is ESM-only; use dynamic import from CommonJS
    const  { createDB } = await import('mysql-memory-server');
    const  db = await createDB({
        dbName: 'soar',
        xEnabled: 'OFF',
        logLevel: 'WARN'
    });

    // Connect via mysql2/promise to load schema and sample data
    const  mysql = require('mysql2/promise');
    const  conn = await mysql.createConnection({
        host: '127.0.0.1',
        port: db.port,
        user: db.username,
        database: db.dbName,
        password: '',
        multipleStatements: true
    });

    const  schemaSql = fs.readFileSync(schemaPath, 'utf8'),
           dataSql = fs.readFileSync(dataPath, 'utf8');

    await conn.query(schemaSql);
    await conn.query(dataSql);
    await conn.end();

    return  {
        config: {
            dbConfig: {
                type: 'mysql',
                host: '127.0.0.1',
                port: db.port,
                user: db.username,
                database: db.dbName,
                password: '',
                supportBigNumbers: true,
                connectionLimit: 4
            }
        },
        stop: () => db.stop()
    };
}

module.exports = { createInMemoryMysqlConfig };
