SQL-SOAR
========

## What Is SOAR
**SOAR** (Simple Object Adapter for Relational database) is a light-weight node.js module to harness SQL. It saves developers from the painstaking SQL hand-code tasks. Unlike ORM solutions, **soar** gives back to developers the capability to fully control how SQL statements are generated. **soar** has the following interesting features:

+ Reusable SQL: you can easily formulate a SQL statement into an expression. You can later invoke and reuse the same SQL expression with various query conditions.

+ Simple and elegant: you don't have to hand code the sql WHERE clause. Just specify the query values and **soar** will do the magic for you.

+ Multiple database access: it's very easy to access multiple databases within an application using *soar*.

+ Schema manipulation: you can define a table using JSON as the schema notation, and thus manipulate the table definition easily.

+ Full control: unlike ORM solutions, you have full control of how SQL is generated and applied.

+ Extremely light weight and efficient.

## What's New
Here is [what's new](https://github.com/benlue/sql-soar/wiki/New-Features-of-V-1.2.3) of the new release (v1.3.0). You can track how this software evolves in the [release notes](https://github.com/benlue/sql-soar/blob/master/releaseNote.md). Below are some highlights:

+ [v1.2.0] SQL expressions can be stored as files. That makes reuse even easier.

+ [v1.1.5] When joining tables, both syntax as "table AS alias" or "table alias" would work.

+ [v1.1.4] Support the IN clause in the query conditions. Check [this section](#inClause) to see how it can be done easily.

+ [v1.1.3] If necessary, you can directly execute SQL statements using the [runSql()](#runsql) function. 

<a name="5MGuide"></a>
## 5 Minutes Guide
First of all, you have to config **soar** so it knows how to talk with your database:

    var  soar = require('sql-soar'),
    var  options = {
            dbConfig: {
                "host"     : "127.0.0.1",
                "database" : "soar",
                "user"     : "your_db_acc_name",
                "password" : "your_db_passwd",
                "connectionLimit"   : 32
            }
         };
    soar.config( options );

where "connectionLimit" specifies how many connections will be created and buffered in the connection pool.

That's all you need to do for setup. Now assuming you have a table called 'Person' and you want to find out all persons with age equal to 25 in that table. Below is how you can do with **soar**:

    soar.list('Person', {age: 25}, function(err, list) {
        // 'list' will contain persons whose age is 25.
    });

That's similar to issuing a SQL statement like:

    SELECT * FROM Person WHERE age = 25;

If you're sure your query result should have at most one entity, you may consider using "query" instead of "list":

    soar.query('Person', {name: "David Lynch"}, function(err, data) {
        if (err)
            console.log( err.stack );
        else
            console.log('About David: %s', JSON.stringify(data));
    });

So the signatures of the querying calls can be summarized as below:

    soar.query('table_name', query_values, cb);
    soar.list('table_name', query_values, cb);

where "query_values" is the column-value pair that will be translated into the WHERE clause. The query object can contain multiple properties. In that case, all properties wil be ANDed together. For example:

    soar.list('Person, {age:25, city:'Oakland'}, callback);
    
is the same as the following SQL statement:

    SELECT * FROM Person WHERE age = 25 AND city = 'Oakland';
    
If the comparator is not "=", you can specify the comparator in the query object:

    var  query = {
            age: {op: '>=', value: 25}
         };
         
    soar.list('Person', query, callback);
    
Doing update is just as simple, see the example below:

    soar.update('Person', {weight: 160}, {id: 28}, callback);
    
That's similar to issuing a SQL statement like:

    UPDATE Person SET weight=160 WHERE id=28;
    
Inserting a new entry to a table can be done in a similar fashion:

    soar.insert('Person', {name: 'Sean', age: 18}, callback);
    
so as "delete":

    soar.del('Person', {age: 18}, callback);

As you can see the CRUD (create, read, update and delete) operations can be done in a very simple and intuitive way. However, the features shown above are just handy functions. They all invoke the _execute()_ function to do their jobs. If you need to specify very complicated WHERE clauses, do table joins or do things in transactions and so forth, you'll need to do it with the _execute()_ function. The _execute()_ function is very powerful and probably too sophisticated for this 5 minutes guide. If you're interested, please refer to the [_execute()_](#soarExecute) API.

## Installation

    npm install sql-soar

## Contents

+ [DB settings](#dbSetup)
  + [config.json file](#config)
  + [configure programmatically](#configProg)
  + [Multiple database configuration](#multidb)
+ [SQL Expressions](#accessDB)
+ [API](#dynamicAPI)
  + [APIs related to SQL expressions](#sqlExprAPI)
    + [soar.sql()](#soarSBI)
    + [expr.join()](#sbiJoin)
    + [expr.column()](#sbiColumn)
    + [expr.filter()](#sbiFilter)
    + [expr.extra()](#sbiExtra)
  + [APIs related to data manipulation](#crudAPI)
    + [execute()](#soarExecute)
    + [query()](#dynamicQuery)
    + [list()](#dynamicList)
    + [insert()](#dynamicInsert)
    + [update()](#dynamicUpdate)
    + [del()](#dynamicDelete)
    + [runSql()](#runsql)
    + [How to do transactions](#transaction)
+ [Schema management](#schema)
  + [createTable()](#createTable)
  + [alterTable()](#alterTable)
  + [deleteTable()](#deleteTable)
  + [describeTable()](#describeTable)
+ [Debug messages](#debug)

<a name="dbSetup"></a>
## DB Settings

There are two ways to setup the database configuration in SOAR: using a config file or doing it programmatically.

<a name="config"></a>
### The config.json File

Right beneath the SOAR installation directory, there is a **config.json** file which would look like:

    {
    	"dbConfig": {
    		"host"     : "127.0.0.1",
    		"database" : "soar",
    		"user"     : "myDB_acc_name",
    		"password" : "xxxx",
    		"supportBigNumbers" : true,
    		"connectionLimit"   : 32
    	},
        "storedExpr": "file_path_to_the_stored_expressions"
    }

where **host** is the database host and **database** is the database name. **user** and **password** are the database user name and password respectively. SOAR ueses the _mysql_ node module as its mySQL driver and the connection pool feature is turned on by default.

There is another property "storedExpr" specified in the option. The **storedExpr** property denotes the file directory where stored SQL expressions are located. This property is optional. If you don't use any stored SQL expression at all, you can leave out this property.

<a name="configProg"></a>
### Configure Programmatically

You can configure the database connection settings right inside your node.js application. Here is how:

    var  soar = require('sql-soar');
    var  options = {
                dbConfig: {
                    "host"     : "127.0.0.1",
                    "database" : "soar",
                    "user"     : "myDB_acc_name",
                    "password" : "xxxx",
                    "supportBigNumbers" : true,
                    "connectionLimit"   : 32
                },
                "storedExpr": "file_path_to_the_stored_expressions"
         };

    soar.config( options );

The option settings are the same as the config.json file.

<a name="multidb"></a>
### Multiple Databases Configuration

Using SOAR to access multiple databases is extremely easy. In this section, we'll show you how to configure SOAR to connect to multiple databases.

In your **config.json** file, use an array of options instead of a single configuration option with each option specifying the settings of each database. Below is an example:

	[
    {
    	"dbConfig": {
    		"host"     : "127.0.0.1",
    		"database" : "db_1",
    		"user"     : "db1_acc_name",
    		"password" : "xxxx",
    		"supportBigNumbers" : true,
    		"connectionLimit"   : 32
    	}
    },
    {
    	"dbConfig": {
    		"host"     : "127.0.0.1",
    		"database" : "db_2",
    		"user"     : "db2_acc_name",
    		"password" : "xxxx",
    		"supportBigNumbers" : true,
    		"connectionLimit"   : 32
    	}
    }
    ]

If you need to connect to 10 databases in your application, then the configuration array should have 10 elements. Configuring multiple databases programmatically is done similarily.

How to access each database in a multi-databases scenario will be explained in each database access method (query, list, create, update and delete) below.

<a name="accessDB"></a>
## SQL Expressions

As explained in the ["5 Minutes Guide"](#5MGuide) above, if you want to do sophisticated SQL queries, you'll need a more powerful tool. That tool is *SQL expression*.

With SQL expressions, you can compose and reuse SQL queries in a clean and managable way. In essence, SQL expressions are nothing more than SQL statements encoded as a JSON object. An example should help to explain what is a SQL expression:

    var  expr = soar.sql('Person')
                    .column(['id', 'addr AS address', 'age'])
                    .filter( {name: 'age', op: '>='} )
                    .extra( 'ORDER BY id' );
    
You can use the above SQL expression to do a database query:

    var  cmd = {list: expr},
         query = {age: 18};
    
    soar.execute(cmd, query, function(err, list) {
    	// 'list' is the query result
    });

That's equivalent to:

    SELECT id, addr AS address, age
    FROM Person
    WHERE age >= 18;
    
**soar** will match the input query with the filter section of a SQL expression.

"Well, that looks nice but what's the befenit?" you may ask. The best part of SQL expression is that you can simply specify your query conditions as a JSON object and **soar** will match your query objerct with the **filter** section of a SQL expression. In other words, you're saved from the pains-taking task to re-compose a SQL statement simply becase you've changed your query condition (even very slightly) .

Besides, you can use the same SQL expressions  in all CRUD operations. **soar** is smart enough to retrieve the related information from a SQL expression and compose the intended SQL statement. For example, you can use the same SQL expression for query to do update:

    var  cmd = {update: expr};
         
    soar.execute(cmd, {canDrive: true}, {age: 18}, callback);

Constructing a SQL expression is simple. It starts from the _soar.sql(tableName)_ function. The _soar.sql(tableName)_ function takes a table name as its input and returns a **SQL Expression** object. With that object, you can add selected table columns, set query conditions and specify addtional options (such as GROUP BY or ORDER BY). Every SQL expression function returns the expression object itself, so you can chain funcion calls to succintly compose a SQL expression.

What's better, if you keep using some SQL expressions in your applications, you may want to save them into files so you can reuse them. Stored in files, such SQL expressions are also very easy to maintain.

<a name="dynamicAPI"></a>
## API

<a name="sqlExprAPI"></a>
### APIs related to SQL expressions

<a name="soarSBI"></a>
#### soar.sql(tableName)

This function returns a SQL expression. _tableName_ is the name of a table. If you'll access multiple databases in an application, _tableName_ has to be in the form of _dbName.tableName_ so that **soar** knows which database to talk to.

Example:

    var  expr = soar.sql('myTable');

<a name="sbiJoin"></a>
#### expr.join(joinExpr)

With the SQL expression obtained from the _soar.sql()_ funciton call, you  can use its _join()_ function to specify table joins.

Example:

    var  expr = soar.sql('myTable AS myT')
                    .join({
                        table: 'Location AS loc', 
                        on: 'myT.locID=loc.locID'
                     });
    
If you want to make multiple joins, just call _join()_ as many times as you need. The parameter to the _join()_ function call is a plain JSON object with the following properties:

+ table: name of the joined table.
+ type: if you want to make a left join, you can set this property to 'LEFT'.
+ on: the join clause. If the _use_ property described below is specified, this property will be ignored.
+ use: the common column name to join two tables.

<a name="sbiColumn"></a>
#### expr.column(column)

This function can be used to add table columns to a SQL expression. To add a single column, the parameter is the name of the column. If you want to add multiple columns, the parameter should be an array of column names.

Example:

    var  expr = soar.sql('Person')
                    .column(['name', 'age', 'weight']);

<a name="sbiFilter"></a>
#### expr.filter(filter)

This function is used to set query conditions (filter) of a SQL expression. **soar** accepts various filter formats so you can easily specify the query conditions needed.

The easiest way is to simply specify a column name as the query condition:

    var  expr = soar.sql('Person')
                    .filter('age');

That is equavilent to the following SQL statement:

    SELECT * FROM Person WHERE age = ?;

If the comparator is not equal (=) but other opertors, you can specify the filter as an object:

    var  expr = soar.sql('Person')
                    .filter({age: '>'});

That is equavilent to the following SQL statement:

    SELECT * FROM Person WHERE age > ?;

The object filter just introduced is actually an short format. The "standard" object filter could have the following properties:

+ name: name of the filter. It's also used as the key to retrieve the query value from a query object. This property is required.
+ field: the real column name in a table. If this property is missing, the _name_ property will be used instead.
+ op: what comparator to be used. It can be '>', '=' or 'IS NULL', etc.
+ noArg: when a query operation does not require argument (e.g. IS NULL), this property should be set to true.

What about compound query conditions? You can do so with a single property filter object and the property value is an array (of object filters) such as the following:

    var  expr = soar.sql('Person')
                    .filter({
                        'or': [
                            {age: '>'},
                            'height'
                        ]
                    });

That is equavilent to the following SQL statement:

    SELECT * FROM Person WHERE age > ? OR height = ?;

If the compound operator is 'and', you can even omit it. For example:

    var  expr = soar.sql('Person')
                    .filter({
                        'and': [
                            {weight: '>'},
                            {height: '>'}
                        ]
                    });

is the same as:

    var  expr = soar.sql('Person')
                    .filter([
                        {weight: '>'},
                        {height: '>'}
                    ]);

<a name="sbiExtra"></a>
#### expr.extra(extra)

This function can add extra options to a SQL statement. _extra_ is a string with possible values like 'GROUP BY col_name' or 'ORDER BY col_name'.

Example:

    var  expr = soar.sql('myTable')
                    .extra('ORDER BY region');

<a name="crudAPI"></a>
### APIs related to data manipulation

<a name="soarExecute"></a>
#### soar.execute(cmd, data, query, cb)

This function can be used to execute SQL queries (query, list, insert, update and delete). The **_data_** parameter is a JSON object which contains data to be inserted or updated to a table entry. The **_query_** parameter is a JSON object which specifies the actual query values. It should be noted the **query** parameter here should just be plain column-value pairs. The [query object](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) format is not applicable here.

The **_cmd_** parameter is a command to **soar**. It usually has an 'operator' property. The operator property can be one of the following: 'query', 'list', 'insert', 'update' and 'delete'. The value of the operator property is a SQL expression that is needed to generate the SQL statement. If you want to invoke a stored SQL expression, this property can be the path name of the stored SQL expression.

Besides, the **_cmd_** parameter could have the following properties:

+ range: specifies the window of a result set. The _range_ object can be created using the _soar.range()_ function.

+ conn: a database connection object. You usually don't have to specify this property unless you want to do transactions.

+ debug: if set to true, **soar** will print out the SQL (prepare) statement along with the parameters applied.

If the **_data_** parameter is not needed, the function call can be simplified to _execute(cmd, query, cb)_.

_cb_ is the callback function which receives an error and sometimes a result object (when it's a query, list or insert operation).

Example:

    var  expr = soar.sql('Person'),
         cmd = {update: expr},
         data = {
            name: 'John',
            age: 32
         };
         
    soar.execute(cmd, data, {id: 24}, function(err)  {
        // set person #24 to name='John' and age=32
    });
     
Example of doing pagination:

    var  expr = soar.sql('Person'),
         cmd = {
            list: expr,
            range: soar.range(1, 10)    // return the first page with page size of 10
         };
         
    soar.execute(cmd, function(err, rows, count)  {
        console.log('total count is: ' + count);
        console.log('but we will only return the first page of 10 items');
    });
    
<a name="dynamicQuery"></a>
#### soar.query(tbName, query, cb)

If you expect a table query should return only one entity (even though there maybe multiple matches to your query), you can use this function.

* tbName: name of the table to be queried. If you're accessing multiple databases, you can use _databaseName.tableName_ to specify which database you intend to query.
* query: the query condition. Refer to [Query Object](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) for how to effectively use it.
* cb: call back function which will be fed with two parameters: _err_ and _data_. _err_ is the error object (if any) and _data_ is the query result as a plain Javascript object.

Example:

    soar.query('Person', {psnID: 1}, function(err, data) {
        // 'data' is the query result
    });
    
    var  query = {
            age: {op: '>=', value: 25},
            weight: {op: '>=', value: 160}
         };
    soar.query('Person', query, function(err, data)  {
        // if data is not null,
        // it's the person who is weighted more than 160 and older than 25 
    });

<a name="dynamicList"></a>    
#### soar.list(tbName, query, cb)

Use this function to get multiple entries from a table.

* tbName: name of the table to be queried. If you're accessing multiple databases, you can use _databaseName.tableName_ to specify which database you intend to query.
* query: the query condition. Refer to [Query Object](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) for how to effectively use it.
* cb: call back function which will be fed with two parameters: _err_ and list. _err_ is the error object (if any) and _list_ is the query result as a Javascript array. If nothing matches, _list_ will be an empty array.

Example:

    soar.list('Person', {age: 25}, function(err, list) {
        // 'list' contains person who is at the age of 25
    });
    
    var  query = {
            age: {op: '>=', value: 25},
            weight: {op: '>=', value: 160}
         };
    soar.list('Person', query, function(err, list)  {
        // 'list' will contain people
        // who is weighted more than 160 and older than 25 
    });

<a name="inClause"></a>   
##### List with the IN clause
It's possible to use IN in the where clause, but it has to be done with the more sophisticaed _execute()_ function. Below is how it can be done:

    var  expr = soar.sql('Person')
                    .filter({name: 'psnID', op: 'IN'});

    var  cmd = {op: 'list', expr: expr},
         query = {psnID: [7, 29, 33]};                    
    soar.execute(cmd, query, function(err, list)  {
        // list will contain people whose id is 7, 29 or 33
    });

<a name="dynamicInsert"></a>    
#### soar.insert(tbName, data, cb)

Inserting a new entry to a table.

* tbName: name of the table to be inserted. If you're accessing multiple databases, you can use _databaseName.tableName_ to specify which database you intend to do insert.
* data: the _data_ to be inserted. If _data_ contains any properties which do not match the target table column, those properties will be ignored.
* cb: call back function which will be fed with two parameters: _err_ and _pk_. _err_ is the error object (if any) and _pk_ is the primary key of the newly inserted entry.

Example:

    soar.insert('Person', {name: 'Scott Cooper'}, function(err, pk) {
        // 'pk' contains the primary key value of the inserted entry
        // for example, it could be something like:
        // {psnID: _the_psnID_of_the_newly_inserted_entity}
        // where 'psnID' is the primary key of the Person table
    });

<a name="dynamicUpdate"></a>    
#### soar.update(tbName, data, query, cb)

Updating data entries in a table.

* tbName: name of the table to be updated. If you're accessing multiple databases, you can use _databaseName.tableName_ to specify which database you intend to update.
* data: the _data_ to be updated. If _data_ contains any properties which do not match the target table column, those properties will be ignored.
* query: the query condition. Refer to [Query Object](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) for how to effectively use it.
* cb: call back function which will be fed with an _err_ parameter (if any).

Example:

    soar.update('Person', {name: 'John Mayer'}, {psnID: 1}, cb);

<a name="dynamicDelete"></a>    
#### soar.del(tbName, query, cb)

Deleting entries of a table.

* tbName: name of the table whose entries will be deleted. If you're accessing multiple databases, you can use _databaseName.tableName_ to specify which database you intend to do deletion.
* query: the query condition. Refer to [Query Object](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) for how to effectively use it.
* cb: call back function which will be fed with an _err_ parameter (if any).

Example:

    soar.del('Person', {psnID: 1}, cb);
    

<a name="runsql"></a>    
#### soar.runSql(conn, sql, arguments, cb)
This function can be used to run SQL statements directly if you still need to. Even though SOAR provides quite a few handy functions to access databases, sometimes you may still need to manually build a SQL statement. In such cases, you can use this function.

* conn: the database connection. This parameter is optional. You'll pass in a connecton parameter mostly because the SQL statement should be executed within a transactions.
* sql: the SQL statement to be executed.
* arguments: data to be filled into the SQL statement (if the given SQL statement is a prepared statement).
* cb: the call back function with two parameters: _err_ and _result_.

Example:

    soar.runSql('SELECT * FROM Person WHERE psnID=?',
                [101],
                function(err, result)  {});
                
    /* execute a SQL statement without parameters */
    soar.runSQL('SELECT * FROM Person', null, function(err, result) {
        // do something in the callback
    }); 

<a name="transaction"></a>    
#### How to do transactions

Doing transaction is faily simple. All you need to do is to obtain a database connection and set it to the soar command. However, only the soar.execute() funciton supprots transactions. You can not apply transactions to soar.query(), soar.list(), soar.update(), soar.insert() and soar.del().

Example:

    var  expr = soar.sql('Person');
    
    soar.getConnection( function(err, conn) {
        // remember to specify database connection in 'cmd'
        var  cmd = {
                insert: expr,
                conn: conn
             },
             data = {name: 'Scott Cooper'};
            
        conn.beginTransaction(function(err) {
            soar.execute(option, data, null, function(err, data) {
                if (err)
                    conn.rollback(function() {
                        // remember to release the connection
                        conn.release();
                    });
                else
                    conn.commit(function(err) {
                        if (err)
                            conn.rollback(function() {
                                // remember to release the connection
                                conn.release();
                            });
                        else
                            conn.release();
                    });		
            });
        };
    });

<a name="schema"></a>
## Schema Management

Besides accessing data, you can also use **soar** to manage table schema.

<a name="createTable"></a>
### createTable(schema, cb)

This function will create a database table. _schema_ is a **schema notation** object which defines a table schema. Please refer to [schema notation](https://github.com/benlue/sql-soar/blob/master/doc/SchemaNotation.md) to know about what it is and how to create a schema notation. _cb_ is a callback function when table creation is successful or erred.

If you want to call _createTable()_ with a specific database conection object, you can do _createTable(conn, schema, cb)_.

<a name="alterTable"></a>
### alterTable(schema, cb)

This function can be used to alter table schema. _schema_ is a **schema notation** object which defines a table schema. Please refer to [schema notation](https://github.com/benlue/sql-soar/blob/master/doc/SchemaNotation.md) to know about what it is and how to create a schema notation. _cb_ is a callback function when altering table is successfully done or erred.

If you want to call _alterTable()_ with a specific database conection object, you can do _alterTable(conn, schema, cb)_.

<a name="deleteTable"></a>
### deleteTable(tableName, cb)

This function can be used to delete (drop) a table. _tableName_ is the name of the table to be dropped. _cb_ is a callback function when deleting table is successfully done or erred.

If you want to call _deleteTable()_ with a specific database conection object, you can do _deleteTable(conn, schema, cb)_.

<a name="describeTable"></a>
### describeTable(tableName, cb)

This function can be used to derive schema from an existing table. _tableName_ is the name of the table to be explored. _cb(err, schema)_ is the callback function to return the table schema. The returned schema object is constructed as suggested by [schema notation](https://github.com/benlue/sql-soar/blob/master/doc/SchemaNotation.md).

If you want to call _describeTable()_ with a specific database conection object, you can do _describeTable(conn, schema, cb)_.

<a name="debug"></a>
## Debug Messages

If you want to know what SQL statements are actually generated by **soar**, you can set the 'debug' property of a **soar** command to be true (this feature only works for the _execute()_ function). For example:

    var  cmd = {
            list: expr,
            debug: true    // set to 'true' will print out SQL
         };
         
    soar.execute(cmd, query, cb);

## Regarding Tests

The **soar** package comes with some test files. To run those tests, sample data have to be built first. Inside the "test/sampleData" directory there are two files: schema.sql and sampleData.sql. Those two files can be used to build the sample data. In addition, remember to change the user name and password in your config.json file and the related database settings in the test programs.

## Supported Database

In the current release, **soar** only supports mySQL. If you want to use **soar** for other databases such as Postgre, MS SQL server or Oracle DB, etc, you'll have to write your own SQL generator. Right now SQL generation is implemented by ./lib/sqlGenMySql.js. 
