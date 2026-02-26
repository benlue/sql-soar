/**
 * schemaManager.js
 * Base SchemaManager class with common functionality
 * authors: Ben Lue
 * Copyright(c) 2023 ~ 2025 Conwell Inc.
 */
class SchemaManager {
    
    constructor() {
        // This will be overridden by subclasses
        this.databaseType = null;
    }

    // Abstract methods that must be implemented by subclasses
    describeTable(conn, tableName, cb) {
        throw new Error('describeTable method must be implemented by subclass');
    }

    toSchemaType(dtype) {
        throw new Error('toSchemaType method must be implemented by subclass');
    }

    getSqlGenerator() {
        throw new Error('getSqlGenerator method must be implemented by subclass');
    }

    // Common methods that work for both databases
    
    /* sample schema:
    {
        title: 'Person',
        columns: {
            Person_id: {type: 'integer', format: 'int64'},
            fname: {
                type: 'string',
                maxLength: 32,
                options: {
                    notNull:
                    default:
                    autoInc:
                    comment
                }
            }
        },
        primary:  ['Person_id'],
        options: {
            engine: 'InnoDB'
        }
    }
    */
    createTable(conn, schema, cb)  {
        let  tableCol = schema.columns,
             tableDef = {title: schema.title, columns: [],
                         primary: schema.primary, options: schema.options};

        for (var key in tableCol)  {
            let  prop = tableCol[key],
                 c = {title: key, type: this.toSQLType(prop)};

            c.options = prop.options || {};

            if (!c.options.engine)
                c.options.engine = 'InnoDB';

            tableDef.columns.push(c);
        }

        // sanity check...
        if (!tableDef.title)
            throw  new Error('Missing table name');
        if (Object.keys(tableDef.columns).length === 0)
            throw  new Error('No table columns');
        if (!tableDef.primary || tableDef.primary.length === 0)
            throw  new Error('Primary key not specified.');

        try  {
            const  sql = this.getSqlGenerator().createTable(tableDef);

            conn.query(sql, function(qErr, result) {
                cb( qErr, result );
            });
        }
        catch (e)  {
            console.error( e );
            cb(e);
        }
    }

    /* sample:
    {
        title: 'Person',
        add: {
            column: {
                age: {type:'integer', format: 'int8'},
            },
            index: {
                IDX_BK_ISBN: {
                    columns: ['ISBN', 'title'],
                    unique: true
                }
            },
            foreignKey: {
                FK_bpdRbk: {
                    key: 'bkID',
                    reference: 'Books.bkID',
                    integrity: {
                        delete: 'cascade'
                        update: 'cascade'
                    }
                }
            }
        },
        drop: {
            column: ['addr'],
            index: ['index_name'],
            foreignKey: ['FK_bpdRbk']
        }
    }
     */
    alterTable(conn, schema, cb)  {
        let  updSchema = {},
             props = Object.getOwnPropertyNames(schema)

        for (var i in props)  {
            let  key = props[i];
            updSchema[key] = schema[key];
        }

        if (updSchema.add && updSchema.add.column)
            updSchema.add.column = this.convertColSpec(updSchema.add.column);
        if (updSchema.alter && updSchema.alter.column)
            updSchema.alter.column = this.convertColSpec(updSchema.alter.column);
        
        try  {
            const  sql = this.getSqlGenerator().alterTable(updSchema);
            conn.query(sql, function(qErr, result) {
                cb( qErr, result );
            });
        }
        catch (e)  {
            console.error( e );
            cb(e);
        }
    }


    deleteTable(conn, tbName, cb)  {
        throw new Error('deleteTable method must be implemented by subclass');
    }


    renameTable(conn, oldName, newName, cb)  {
        throw new Error('renameTable method must be implemented by subclass');
    }

    // Helper methods (common to both databases)
    
    convertColSpec(cols)  {
        var columns = [];
        for (var key in cols)  {
            var  prop = cols[key],
                 c = {title: key, name: prop.title, type: this.toSQLType(prop)};
            if (prop.options)
                c.options = prop.options;

            columns.push( c );
        }
        return  columns;
    }

    /*
    columns: {
            Person_id: {type: 'integer', format: 'int64'},
            fname: {
                type: 'string',
                maxLength: 32,
                options: {
                    notNull:
                    default:
                    autoInc:
                    comment
                }
            }
        }
    */
    readColumns(columns, isPostgreSQL)  {
        let  tableCol = {};
        if (isPostgreSQL)
            columns = columns.rows

        columns.forEach( c => {
            let  prop = this.toSchemaType(c.Type);

            if (c.Null)
                prop.options.notNull = c.Null === 'NO';
            if (c.Default)
                prop.options.default = c.Default;
            if (c.Extra === 'auto_increment')
                prop.options.autoInc = c.Extra;

            if (Object.keys(prop.options).length === 0)
                delete  prop.options;

            tableCol[c.Field] = prop;
        })

        return  tableCol;
    }

    readPrimaryKeys(rows)  {
        return  rows.map(r => r.Column_name)
        // let  pk = [];
        
        // for (let i in rows)
        //     pk.push( rows[i].Column_name );

        // return  pk;
    }

    readTableStatus(status)  {
        let  options = {engine: status.Engine};
        return  options;
    }

    toSQLType(prop)  {
        throw new Error('toSQLType method must be implemented by subclass');
    }
}

module.exports = SchemaManager;