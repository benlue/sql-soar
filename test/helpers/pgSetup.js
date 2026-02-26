/**
 * PGlite in-memory PostgreSQL test setup.
 * Creates an ephemeral PostgreSQL database with schema and sample data.
 * No external PostgreSQL server required.
 *
 * @author Ben Lue
 * @copyright 2025 ~ 2026 Conwell Inc.
 */
'use strict';

const  fs = require('fs'),
       path = require('path'),
       PGliteAdapter = require('./pgliteAdapter');

const  schemaPath = path.join(__dirname, '../sampleData/postgresql/schema-inmemory.sql'),
       dataPath = path.join(__dirname, '../sampleData/postgresql/sampleData-inmemory.sql');

/**
 * Create an in-memory PostgreSQL database using PGlite.
 * Returns a soar-compatible config object with an injected pool.
 */
async function  createInMemoryPgConfig()  {
    // PGlite is ESM-only; use dynamic import from CommonJS
    const  { PGlite } = await import('@electric-sql/pglite');
    const  db = new PGlite();   // in-memory (no path = ephemeral)

    // Load schema and sample data
    const  schemaSql = fs.readFileSync(schemaPath, 'utf8'),
           dataSql = fs.readFileSync(dataPath, 'utf8');

    await db.exec(schemaSql);
    await db.exec(dataSql);

    const  pool = new PGliteAdapter(db);
    return  {
        dbConfig: {
            type: 'postgresql',
            database: 'soar',
            pool: pool
        }
    };
}

module.exports = { createInMemoryPgConfig };
