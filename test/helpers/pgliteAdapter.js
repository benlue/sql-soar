/**
 * PGlite adapter that wraps PGlite to look like a pg Pool.
 * Used for in-memory PostgreSQL testing without an external server.
 *
 * @author Ben Lue
 * @copyright 2025 ~ 2026 Conwell Inc.
 */
'use strict';

class PGliteAdapter {

    constructor(pglite)  {
        this.db = pglite;
    }

    async connect()  {
        const  db = this.db;
        return  {
            query: async function(sql, params)  {
                const  result = await db.query(sql, params);
                return  {
                    rows: result.rows,
                    // PGlite: affectedRows is 0 for SELECT; use rows.length when rows exist
                    rowCount: result.rows.length > 0
                        ? result.rows.length : (result.affectedRows || 0),
                    fields: result.fields
                };
            },
            release: function() {}  // no-op — PGlite is single-connection
        };
    }

    async end()  {
        await this.db.close();
    }
}

module.exports = PGliteAdapter;
