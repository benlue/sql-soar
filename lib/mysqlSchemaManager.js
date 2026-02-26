/**
 * mysqlSchemaManager.js
 * MySQL-specific SchemaManager implementation
 * authors: Ben Lue
 * Copyright(c) 2023 ~ 2025 Conwell Inc.
 */
const  SchemaManager = require('./schemaManager'),
       sqlGenMySQL = require('./sql/sqlGenMySql.js');

class MySQLSchemaManager extends SchemaManager {
    
    constructor() {
        super();
        this.databaseType = 'mysql';
    }


    async deleteTable(conn, tbName)  {
        const  sql = 'DROP TABLE ' + tbName;
        await conn.query(sql);
    }


    async renameTable(conn, oldName, newName)  {
        const  sql = `RENAME TABLE \`${oldName}\` TO \`${newName}\`;`;
        await conn.query(sql);
    }


    async describeTable(conn, tableName)  {
        let  sql = `SHOW COLUMNS FROM ${tableName}`;
        const  [rows] = await conn.query(sql);

        sql = `SHOW INDEX FROM ${tableName} WHERE Key_name='PRIMARY'`;
        const  [pkRows] = await conn.query(sql);

        sql = `SHOW TABLE STATUS WHERE name='${tableName}'`;
        const  [tbData] = await conn.query(sql);

        return  {
            title: tableName,
            columns: this.readColumns(rows, false),
            primary: this.readPrimaryKeys(pkRows),
            options: this.readTableStatus(tbData[0])
        };
    }

    toSchemaType(dtype)  {
        let  prop = {options: {}},
             isSolved = true;

        // Normalize the type for easier processing
        const  normalizedType = dtype.toLowerCase().trim();

        switch (normalizedType)  {
            // Boolean types (MySQL spec: BOOLEAN/BOOL are aliases for TINYINT(1))
            case 'boolean':
            case 'bool':
            case 'tinyint(1)':
                prop.type = 'boolean';
                break;

            case 'tinyint':
                prop.type = 'integer';
                prop.format = 'int8';
                break;

            case 'smallint':
                prop.type = 'integer';
                prop.format = 'int16';
                break;

            case 'mediumint':
                prop.type = 'integer';
                prop.format = 'int24';
                break;

            case 'int':
            case 'integer':
                prop.type = 'integer';
                break;

            case 'bigint':
                prop.type = 'integer';
                prop.format = 'int64';
                break;

            // Floating point types
            case 'float':
                prop.type = 'number';
                prop.format = 'float';
                break;

            case 'double':
            case 'double precision':
                prop.type = 'number';
                prop.format = 'double';
                break;

            case 'real':
                prop.type = 'number';
                prop.format = 'float';
                break;

            // String types
            case 'text':
                prop.type = 'string';
                prop.format = 'text';
                break;

            case 'tinytext':
                prop.type = 'string';
                prop.format = 'tinytext';
                break;

            case 'mediumtext':
                prop.type = 'string';
                prop.format = 'mediumtext';
                break;

            case 'longtext':
                prop.type = 'string';
                prop.format = 'longtext';
                break;

            // Date/Time types
            case 'date':
                prop.type = 'date';
                break;

            case 'time':
                prop.type = 'time';
                break;

            case 'datetime':
                prop.type = 'datetime';
                break;

            case 'timestamp':
                prop.type = 'timestamp';
                break;

            case 'year':
                prop.type = 'year';
                break;

            // MySQL-specific types
            case 'json':
                prop.type = 'json';
                break;

            // Binary types
            case 'blob':
                prop.type = 'binary';
                break;

            case 'tinyblob':
                prop.type = 'binary';
                prop.format = 'tinyblob';
                break;

            case 'mediumblob':
                prop.type = 'binary';
                prop.format = 'mediumblob';
                break;

            case 'longblob':
                prop.type = 'binary';
                prop.format = 'longblob';
                break;

            // Spatial/Geometric types
            case 'geometry':
                prop.type = 'geometry';
                break;

            case 'point':
                prop.type = 'point';
                break;

            case 'linestring':
                prop.type = 'linestring';
                break;

            case 'polygon':
                prop.type = 'polygon';
                break;

            case 'multipoint':
                prop.type = 'multipoint';
                break;

            case 'multilinestring':
                prop.type = 'multilinestring';
                break;

            case 'multipolygon':
                prop.type = 'multipolygon';
                break;

            case 'geometrycollection':
                prop.type = 'geometrycollection';
                break;

            default:
                isSolved = false;
        }

        // Handle parameterized types and UNSIGNED attribute
        if (!isSolved)  {
            if (normalizedType.indexOf('decimal') === 0 || normalizedType.indexOf('numeric') === 0)  {
                prop.type = 'number';
                const  idx0 = normalizedType.indexOf('('),
                       idx1 = normalizedType.indexOf(')');
                if (idx0 > 0)
                    prop.format = 'decimal(' + normalizedType.substring(idx0+1, idx1) + ')';
            }
            else if (normalizedType.indexOf('varchar') === 0 || normalizedType.indexOf('char') === 0)  {
                prop.type = 'string';
                const  idx0 = normalizedType.indexOf('('),
                       idx1 = normalizedType.indexOf(')');
                if (idx0 > 0)
                    prop.maxLength = parseInt(normalizedType.substring(idx0 + 1, idx1));
            }
            else if (normalizedType.indexOf('binary') === 0)  {
                prop.type = 'binary';
                const  idx0 = normalizedType.indexOf('('),
                       idx1 = normalizedType.indexOf(')');
                if (idx0 > 0)
                    prop.maxLength = parseInt(normalizedType.substring(idx0 + 1, idx1));
            }
            else if (normalizedType.indexOf('varbinary') === 0)  {
                prop.type = 'varbinary';
                const  idx0 = normalizedType.indexOf('('),
                       idx1 = normalizedType.indexOf(')');
                if (idx0 > 0)
                    prop.maxLength = parseInt(normalizedType.substring(idx0 + 1, idx1));
            }
            // Handle integer types with parameters and UNSIGNED
            else if (normalizedType.indexOf('bigint') === 0)  {
                prop.type = 'integer';
                prop.format = 'int64';
                if (normalizedType.indexOf('unsigned') > 0) {
                    prop.options.unsigned = true;
                }
            }
            else if (normalizedType.indexOf('int') === 0)  {
                prop.type = 'integer';
                if (normalizedType.indexOf('unsigned') > 0) {
                    prop.options.unsigned = true;
                }
            }
            else if (normalizedType.indexOf('smallint') === 0)  {
                prop.type = 'integer';
                prop.format = 'int16';
                if (normalizedType.indexOf('unsigned') > 0) {
                    prop.options.unsigned = true;
                }
            }
            else if (normalizedType.indexOf('mediumint') === 0)  {
                prop.type = 'integer';
                prop.format = 'int24';
                if (normalizedType.indexOf('unsigned') > 0) {
                    prop.options.unsigned = true;
                }
            }
            else if (normalizedType.indexOf('tinyint') === 0)  {
                // Check if it's TINYINT(1) which should be boolean
                if (normalizedType.indexOf('tinyint(1)') === 0) {
                    prop.type = 'boolean';
                } else {
                    prop.type = 'integer';
                    prop.format = 'int8';
                    if (normalizedType.indexOf('unsigned') > 0) {
                        prop.options.unsigned = true;
                    }
                }
            }
            // Handle date/time types with precision (check more specific patterns first)
            else if (normalizedType.indexOf('timestamp') === 0)  {
                prop.type = 'timestamp';
                const  idx0 = normalizedType.indexOf('('),
                       idx1 = normalizedType.indexOf(')');
                if (idx0 > 0)
                    prop.precision = parseInt(normalizedType.substring(idx0 + 1, idx1));
            }
            else if (normalizedType.indexOf('datetime') === 0)  {
                prop.type = 'datetime';
                const  idx0 = normalizedType.indexOf('('),
                       idx1 = normalizedType.indexOf(')');
                if (idx0 > 0)
                    prop.precision = parseInt(normalizedType.substring(idx0 + 1, idx1));
            }
            else if (normalizedType.indexOf('time') === 0)  {
                prop.type = 'time';
                const  idx0 = normalizedType.indexOf('('),
                       idx1 = normalizedType.indexOf(')');
                if (idx0 > 0)
                    prop.precision = parseInt(normalizedType.substring(idx0 + 1, idx1));
            }
            else if (normalizedType.indexOf('year') === 0)  {
                prop.type = 'year';
                const  idx0 = normalizedType.indexOf('('),
                       idx1 = normalizedType.indexOf(')');
                if (idx0 > 0) {
                    const  yearFormat = normalizedType.substring(idx0 + 1, idx1);
                    if (yearFormat === '2')
                        prop.format = 'year(2)';
                }
            }
            else
                // For unknown types, pass through as-is
                prop.type = dtype;
        }

        return  prop;
    }


    toSQLType(prop)  {
        let  dtype;
        switch (prop.type)  {
            case 'boolean':
                // MySQL uses TINYINT(1) for boolean, with BOOLEAN as alias
                dtype = 'boolean';
                break;

            case 'integer':
                switch (prop.format)  {
                    case 'int8':
                        dtype = 'tinyint';
                        break;
                    case 'int16':
                        dtype = 'smallint';
                        break;
                    case 'int24':
                        // MySQL-specific 3-byte integer
                        dtype = 'mediumint';
                        break;
                    case 'int64':
                        dtype = 'bigint';
                        break;
                    default:
                        dtype = 'int';
                }
                
                // Handle unsigned option
                if (prop.options && prop.options.unsigned) {
                    dtype += ' unsigned';
                }
                break;

            case 'number':
                if (prop.format)  {
                    if (prop.format.indexOf('decimal') === 0) {
                        // Extract precision and scale from format like "decimal(10,2)"
                        const  idx0 = prop.format.indexOf('(');
                        if (idx0 > 0)
                            dtype = 'decimal(' + prop.format.substring(idx0 + 1);
                        else
                            dtype = 'decimal' + prop.format.substring(7);
                    }
                    else if (prop.format === 'double')
                        dtype = 'double';
                    else if (prop.format === 'float')
                        dtype = 'float';
                    else
                        dtype = 'float';
                }
                else
                    dtype = 'float';
                break;

            case 'string':
                if (prop.format === 'text')
                    dtype = 'text';
                else if (prop.format === 'longtext')
                    dtype = 'longtext';
                else if (prop.format === 'mediumtext')
                    dtype = 'mediumtext';
                else if (prop.format === 'tinytext')
                    dtype = 'tinytext';
                else {
                    if (prop.maxLength) {
                        if (prop.maxLength <= 255)
                            dtype = 'varchar(' + prop.maxLength + ')';
                        else if (prop.maxLength <= 65535)
                            dtype = 'text';
                        else if (prop.maxLength <= 16777215)
                            dtype = 'mediumtext';
                        else
                            dtype = 'longtext';
                    } else
                        dtype = 'text';
                }
                break;

            case 'serial':
                // MySQL SERIAL is alias for BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE
                dtype = 'bigint unsigned not null auto_increment unique';
                break;

            // MySQL-specific data types
            case 'year':
                // MySQL YEAR type (2 or 4 digit year)
                if (prop.format && prop.format === 'year(2)')
                    dtype = 'year(2)';
                else
                    dtype = 'year';
                break;

            case 'date':
                dtype = 'date';
                break;

            case 'time':
                if (prop.precision)
                    dtype = 'time(' + prop.precision + ')';
                else
                    dtype = 'time';
                break;

            case 'datetime':
                if (prop.precision)
                    dtype = 'datetime(' + prop.precision + ')';
                else
                    dtype = 'datetime';
                break;

            case 'timestamp':
                if (prop.precision)
                    dtype = 'timestamp(' + prop.precision + ')';
                else
                    dtype = 'timestamp';
                break;

            case 'json':
                // MySQL 5.7+ JSON data type
                dtype = 'json';
                break;

            case 'binary':
                if (prop.maxLength) {
                    if (prop.maxLength <= 255)
                        dtype = 'binary(' + prop.maxLength + ')';
                    else if (prop.maxLength <= 65535)
                        dtype = 'blob';
                    else if (prop.maxLength <= 16777215)
                        dtype = 'mediumblob';
                    else
                        dtype = 'longblob';
                } else
                    dtype = 'blob';
                break;

            case 'varbinary':
                if (prop.maxLength)
                    dtype = 'varbinary(' + prop.maxLength + ')';
                else
                    dtype = 'varbinary(255)';
                break;

            // Geometric data types (MySQL spatial extensions)
            case 'geometry':
                dtype = 'geometry';
                break;

            case 'point':
                dtype = 'point';
                break;

            case 'linestring':
                dtype = 'linestring';
                break;

            case 'polygon':
                dtype = 'polygon';
                break;

            default:
                // For unknown types, pass through as-is
                dtype = prop.type;
        }

        return  dtype;
    }
    

    getSqlGenerator() {
        return sqlGenMySQL;
    }
}

module.exports = MySQLSchemaManager;