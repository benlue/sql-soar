/**
 * postgreSchemaManager.js
 * PostgreSQL-specific SchemaManager implementation
 * authors: Ben Lue
 * Copyright(c) 2023 ~ 2025 Conwell Inc.
 */
const  SchemaManager = require('./schemaManager'),
       sqlGenPostgreSQL = require('./sql/sqlGenPostgreSQL.js');

class PostgreSQLSchemaManager extends SchemaManager {
    
    constructor() {
        super();
        this.databaseType = 'postgresql';
    }


    deleteTable(conn, tbName, cb)  {
        const  sql = `DROP TABLE "${tbName}"`;
        try  {
            conn.query(sql, function(err) {
                cb(err);
            });
        }
        catch (e)  {
            cb(e);
        }
    }


    renameTable(conn, oldName, newName, cb)  {
        const  sql = `ALTER TABLE "${oldName}" RENAME TO "${newName}";`;
        try  {
            conn.query(sql, function(err) {
                cb(err);
            });
        }
        catch (e)  {
            cb(e);
        }
    }


    describeTable(conn, tableName, cb)  {
        // PostgreSQL query to get column information
        let  sql = `SELECT 
                        column_name as "Field", 
                        data_type as "Type", 
                        is_nullable as "Null", 
                        column_default as "Default",
                        CASE 
                            WHEN column_default LIKE 'nextval%' THEN 'auto_increment'
                            ELSE ''
                        END as "Extra"
                    FROM information_schema.columns 
                    WHERE table_name = '${tableName}' 
                    ORDER BY ordinal_position`;

        conn.query(sql, (err, rows) => {
            if (err)
                cb( err );
            else  {
                // PostgreSQL query to get primary key information
                sql = `SELECT column_name as "Column_name"
                       FROM information_schema.table_constraints tc
                       JOIN information_schema.key_column_usage kcu
                       ON tc.constraint_name = kcu.constraint_name
                       WHERE tc.table_name = '${tableName}' 
                       AND tc.constraint_type = 'PRIMARY KEY'
                       ORDER BY kcu.ordinal_position`;

                conn.query(sql, (err, pkRows) => {
                    if (err)
                        cb( err );
                    else  {
                        // PostgreSQL doesn't have table status like MySQL
                        // We'll provide a default engine name
                        let  tbData = [{Engine: 'PostgreSQL'}];
                        let  schema = {
                                title: tableName,
                                columns: this.readColumns(rows, true),
                                primary: this.readPrimaryKeys(pkRows.rows),
                                options: this.readTableStatus(tbData[0])
                             };
                        cb( null, schema );
                    }
                });
            }
        });
    }

    toSchemaType(dtype)  {
        let  prop = {options: {}},
             isSolved = true;

        switch (dtype)  {
            case 'boolean':
                prop.type = 'boolean';
                break;

            case 'smallint':
                prop.type = 'integer';
                prop.format = 'int16';
                break;

            case 'integer':
                prop.type = 'integer';
                break;

            case 'bigint':
                prop.type = 'integer';
                prop.format = 'int64';
                break;

            case 'real':
                prop.type = 'number';
                prop.format = 'float';
                break;

            case 'double precision':
                prop.type = 'number';
                prop.format = 'double';
                break;

            case 'text':
                prop.type = 'string';
                prop.format = 'text';
                break;

            case 'character varying':
            case 'varchar':
                prop.type = 'string';
                break;

            case 'character':
            case 'char':
                prop.type = 'string';
                break;

            // Serial types (auto-increment)
            case 'serial':
                prop.type = 'serial';
                break;

            case 'smallserial':
                prop.type = 'serial';
                prop.format = 'int16';
                break;

            case 'bigserial':
                prop.type = 'serial';
                prop.format = 'int64';
                break;

            // Date/Time types
            case 'date':
                prop.type = 'date';
                break;

            case 'time without time zone':
                prop.type = 'time';
                break;

            case 'time with time zone':
                prop.type = 'time';
                prop.withTimeZone = true;
                break;

            case 'timestamp without time zone':
                prop.type = 'timestamp';
                break;

            case 'timestamp with time zone':
                prop.type = 'timestamp';
                prop.withTimeZone = true;
                break;

            case 'interval':
                prop.type = 'interval';
                break;

            // PostgreSQL-specific types
            case 'uuid':
                prop.type = 'uuid';
                break;

            case 'json':
                prop.type = 'json';
                break;

            case 'jsonb':
                prop.type = 'jsonb';
                break;

            // Binary data types
            case 'bytea':
                prop.type = 'binary';
                break;

            // Network address types
            case 'inet':
                prop.type = 'inet';
                break;

            case 'cidr':
                prop.type = 'cidr';
                break;

            case 'macaddr':
                prop.type = 'macaddr';
                break;

            // Geometric types
            case 'point':
                prop.type = 'point';
                break;

            case 'line':
                prop.type = 'line';
                break;

            case 'lseg':
                prop.type = 'lseg';
                break;

            case 'box':
                prop.type = 'box';
                break;

            case 'path':
                prop.type = 'path';
                break;

            case 'polygon':
                prop.type = 'polygon';
                break;

            case 'circle':
                prop.type = 'circle';
                break;

            default:
                isSolved = false;
        }

        if (!isSolved)  {
            if (dtype.indexOf('numeric') === 0 || dtype.indexOf('decimal') === 0)  {
                prop.type = 'number';
                const  idx0 = dtype.indexOf('('),
                       idx1 = dtype.indexOf(')');
                if (idx0 > 0)
                    prop.format = 'decimal(' + dtype.substring(idx0+1, idx1) + ')';
            }
            else  if (dtype.indexOf('character varying') === 0)  {
                prop.type = 'string';
                const  idx0 = dtype.indexOf('('),
                       idx1 = dtype.indexOf(')');
                if (idx0 > 0)
                    prop.maxLength = parseInt(dtype.substring(idx0 + 1, idx1));
            }
            else  if (dtype.indexOf('character') === 0)  {
                prop.type = 'string';
                const  idx0 = dtype.indexOf('('),
                       idx1 = dtype.indexOf(')');
                if (idx0 > 0)
                    prop.maxLength = parseInt(dtype.substring(idx0 + 1, idx1));
            }
            else  if (dtype.indexOf('varchar') === 0)  {
                prop.type = 'string';
                const  idx0 = dtype.indexOf('('),
                       idx1 = dtype.indexOf(')');
                if (idx0 > 0)
                    prop.maxLength = parseInt(dtype.substring(idx0 + 1, idx1));
            }
            // Handle array types
            else  if (dtype.endsWith('[]'))  {
                const  baseType = dtype.substring(0, dtype.length - 2);
                prop.type = 'array';
                prop.arrayOf = this.toSchemaType(baseType);
            }
            else
                prop.type = dtype;
        }

        return  prop;
    }


    toSQLType(prop)  {
        let  dtype;

        switch (prop.type)  {
            case 'boolean':
                // PostgreSQL has native boolean type
                dtype = 'boolean';
                break;

            case 'integer':
                switch (prop.format)  {
                    case 'int8':
                        // PostgreSQL doesn't have tinyint, use smallint instead
                        dtype = 'smallint';
                        break;
                    case 'int16':
                        dtype = 'smallint';
                        break;
                    case 'int64':
                        dtype = 'bigint';
                        break;
                    default:
                        // Use PostgreSQL's standard integer type
                        dtype = 'integer';
                }
                break;

            case 'number':
                if (prop.format)  {
                    if (prop.format.indexOf('decimal') === 0) {
                        // Extract precision and scale from format like "decimal(10,2)"
                        const  idx0 = prop.format.indexOf('(');
                        if (idx0 > 0)
                            dtype = 'numeric(' + prop.format.substring(idx0 + 1);
                        else
                            dtype = 'numeric' + prop.format.substring(7);
                    }
                    else if (prop.format === 'double')
                        // PostgreSQL uses "double precision" not "double"
                        dtype = 'double precision';
                    else if (prop.format === 'float')
                        // PostgreSQL uses "real" for single precision float
                        dtype = 'real';
                    else
                        dtype = 'real';
                }
                else
                    dtype = 'real';
                break;

            case 'string':
                if (prop.format === 'text')
                    dtype = 'text';
                else  {
                    // PostgreSQL varchar syntax
                    if (prop.maxLength)
                        dtype = 'varchar(' + prop.maxLength + ')';
                    else
                        // If no maxLength specified, use text for unlimited length
                        dtype = 'text';
                }
                break;

            case 'serial':
                switch (prop.format) {
                    case 'int64':
                        dtype = 'bigserial';
                        break;
                    case 'int16':
                        dtype = 'smallserial';
                        break;
                    default:
                        dtype = 'serial';
                }
                break;

            // Handle additional PostgreSQL-specific types
            case 'uuid':
                dtype = 'uuid';
                break;

            case 'json':
                dtype = 'json';
                break;

            case 'jsonb':
                dtype = 'jsonb';
                break;

            case 'timestamp':
                if (prop.withTimeZone)
                    dtype = 'timestamp with time zone';
                else
                    dtype = 'timestamp without time zone';
                break;

            case 'date':
                dtype = 'date';
                break;

            case 'time':
                if (prop.withTimeZone)
                    dtype = 'time with time zone';
                else
                    dtype = 'time without time zone';
                break;

            default:
                // For unknown types, pass through as-is
                dtype = prop.type;
        }

        return  dtype;
    }
    

    getSqlGenerator() {
        return sqlGenPostgreSQL;
    }
}

module.exports = PostgreSQLSchemaManager;