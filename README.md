SQL-SOAR
========

## What Is SOAR
**SOAR** (Simple Object Adapter for Relational database) is a light-weight node.js module to harness SQL. It saves developers from the painstaking SQL hand-coding tasks. Unlike most ORM solutions, **soar** gives back to developers the full control of how SQL statements are generated. **soar** has the following interesting features:

+ Reusable SQL: you can formulate a SQL statement into an expression. You can later invoke and reuse that SQL expression with various query conditions.

+ Simple and elegant: you don't have to hand code the sql WHERE clause any more. Just specify the query values and **soar** will do the tedious works for you.

+ Multiple database access: it's very easy to access multiple databases within an application with **soar**.

+ Schema manipulation: you can define a table schema using JSON as the notation, and you can easily manipulate table schemas.

+ Full control: unlike most ORM solutions, you have full control of how SQL is generated and applied.

## What is NOT SOAR
**soar** is NOT an ORM implementation. It will not try to figure out how your tables are associated. It will not retrieve or populate referenced data for you and it will not try to change your database schema.

The idea is to create a tool for developrs to make better decisions than to allow tools making decisions for developers. That's how **soar** is different from ORM solutions.


## For SOARJS Developers
Except for "data view" (table schema representd in XML format) support, sql-soar is mostly compatible with the "soarjs" module. Very likely you can replace "soarjs" with "sql-soar" and your application will run without glitches. However, "sql-soar" has a even cleaner API and more developer friendly features, so "soarjs" developers are encourged to switch.

<a name="5MGuide"></a>
## 5 Minutes Guide
First of all, you have to config **soar** so it knows how to talk with the database:

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

So the signature of the querying calls is as below:

    soar.query('table_name', query, callback);
    soar.list('table_name', query, callback);

"query" is the column-value pair that will be translated into the WHERE clause. If the query object contains more than one properties, they wil be ANDed together. For example:

    soar.list('Person, {age:25, city:'Oakland'}, callback);
    
is like querying database with the following SQL statement:

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

As you can see the CRUD (create, read, update and delete) operations can be done in a very simple and intuitive way. However, the APIs explained above are just handy functions. They all invoke the _execute()_ function to do their jobs. If you want to issue a query with very complicated WHERE clauses, do table joins or do things in transactions and so forth, you'll need to do it with _execute()_. The _execute()_ function is very powerful and too sophisticated for this 5 minutes guide. If you're interested, please refer to the API section about [_execute()_](#soarExecute).

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
    + [soar.chainFilters()](#sbiChainFilter)
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
    	}
    }

where **host** is the database host and **database** is the database name. **user** and **password** are the database user name and password respectively. SOAR ueses the _mysql_ node module as its mySQL driver and the connection pool feature is turned on by default.


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
                }
         };

    soar.config( options );

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

As explained in the ["5 Minutes Guide"](#5MGuide) above, if you want to do sophisticated SQL queries, you'll need a more powerful tool. That tool is the SQL expression.

You can use SQL expressions to instruct **soar** how to talk with databases. With SQL expressions, you can compose and reuse SQL queries in a clean and managable way. In essence, SQL expressions are nothing more than SQL statements encoded as a JSON object. An example should help to understand what is a SQL expression:

    var  expr = soar.sql('Person')
                    .column(['id', 'addr AS address', 'age'])
                    .filter( {name: 'age', op: '>='} )
                    .extra( 'ORDER BY id' );
    
The above sample code just constructed a SQL expression. You can use it to do a database query:

    var  cmd = {
    	    op: 'list',
    	    expr: expr
         },
         query = {age: 18};
    
    soar.execute(cmd, query, function(err, list) {
    	// 'list' is the query result
    });

That's equivalent to:

    SELECT id, addr AS address, age
    FROM Person
    WHERE age >= 18;
    
"Well, that's nice but what's the befenit?" you may ask. The magic is you can use the same SQL expression in update:

    var  cmd = {
            op: 'update',
            expr: expr
         };
         
    soar.execute(cmd, {canDrive: true}, {age: 18}, callback);

Actually, the same SQL expressions can be used in all CRUD operations. **soar** is smart enough to retrieve the needed information from a SQL expression and compose the SQL statement you want.

Assuming you're satisfied, below is how to construct a SQL expression: _soar.sql(tableName)_ takes a table name as its input and returns a **SQL Expression** object. With that object, you can add columns, set query conditions and specify addtional options. Most SQL expression functions will return the expression object itself, so you can chain funcion calls such that SQL expressions can be composed succintly.

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
                        onWhat: 'myT.locID=loc.locID'
                     });
    
If you want to make multiple joins, just call _join()_ as many times as you need. The parameter to the _join()_ function call is a plain JSON object with the following properties:

+ table: name of the joined table.
+ type: if you want to make a left join, you can set this property to 'LEFT'.
+ onWhat: the join clause. If the _use_ property described below is specified, this property will be ignored.
+ use: the common column name to join two tables.

<a name="sbiColumn"></a>
#### expr.column(column)
This function can be used to add table columns to a SQL expression. To add a single column, the parameter is the name of the column. If you want to add multiple columns, the parameter should be an array of column names.

Example:

    var  expr = soar.sql('Person')
                    .column(['name', 'age', 'weight']);

<a name="sbiFilter"></a>
#### expr.filter(filter)
This function is used to set query conditions (filter) of a SQL expression. The parameter to the function call is a plain JSON object with the following properties:

+ name: name of the filter. It's also used as the key to retrieve the query value from a query object. This property is required.
+ field: the real column name in a table. If this property is missing, the _name_ property will be used instead.
+ op: what comparator to be used. It can be '>', '=' or 'IS NULL', etc.
+ noArg: when a query operation does not require argument (e.g. IS NULL), this property should be set to true.

Note that this function should be called just once for a SQL expression. When called multiple times, the new setting will replace the old one.

Example:

    var  expr = soar.sql('Person')
                    .filter({name: 'age', op: '>='});

<a name="sbiChainFilter"></a>
#### soar.chainFilters(op, filters)
If you want to make a compound filter (ANDed or ORed filters), this is the function you need. _op_ should be 'AND' or 'OR', and _filters_ is an array of filters.

Example:

    var  orFilters = soar.chainFilters('OR', [
            {name: 'region', op: '='},
            {name: 'age', op: '>'}
         ]);
         
    var  expr = soar.sql('myTable')
                    .filter( orFilters );

The resulting filter (orFilters) is a compound filter ORing two filters (region and age).

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

The **_cmd_** parameter is a command to **soar** and it has the following properties:

+ op: should be one of the following: 'query', 'list', 'insert', 'update' and 'delete'.

+ expr: the SQL expression needed to generate the required SQL statement.

+ range: specifies the window of a result set. The _range_ object can be created using the _soar.range()_ function.

+ conn: a database connection object. You usually don't have to specify this property unless you want to do transactions.

+ debug: if set to true, **soar** will print out the SQL (prepare) statement along with the parameters applied.

If the **_data_** parameter is not needed, the function call can be simplified to _execute(cmd, query, cb)_.

_cb_ is the callback function which receives an error and sometimes a result object (when it's a query, list or insert operation).

Example:

    var  expr = soar.sql('Person'),
         cmd  {
            op: 'update',
            expr: expr
         },
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
            op: 'list',
            expr: expr,
            range: soar.range(1, 10)    // return the first page with page size of 10
         };
         
    soar.execute(cmd, function(err, rows, count)  {
        console.log('total count is: ' + count);
        console.log('but we will only return the first page of 10 items');
    });
    
<a name="dynamicQuery"></a>
#### soar.query(tbName, query, cb)
If you expect a table query should return only one entity (even though there maybe multiple matches to your query), you can use this function.

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
 
**query** is a query object specifying query conditions. Please refer to this [short article](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) to see how to use query objects effectively.

<a name="dynamicList"></a>    
#### soar.list(tbName, query, cb)

Use this function to query multiple entries from a table.

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

**query** is a query object specifying query conditions. Please refer to this [short article](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) to see how to use query objects effectively.

<a name="dynamicInsert"></a>    
#### soar.insert(tbName, data, cb)
Inserting a new entry to a table. 'data' is the data to be inserted. If 'data' contains properties which do not match to table columns, those properties will be ignored.

Example:

    soar.insert('Person', {name: 'Scott Cooper'}, function(err, pk) {
        // 'pk' contains the primary key value of the inserted entry
        // for example, it could be something like:
        // {psnID: _the_psnID_of_the_newly_inserted_entity}
        // where 'psnID' is the primary key of the Person table
    });

<a name="dynamicUpdate"></a>    
#### soar.update(tbName, data, query, cb)
Updating data entries in a table. 'data' is the new data. 'query' specifies which entries will be updated. The 'query' parameter is used to specify query conditions (the WHERE clause in a SQL statement). To explore the full power of query objects, Please refer to this [short article](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md).

Example:

    soar.update('Person', {name: 'John Mayer'}, {psnID: 1}, cb);

<a name="dynamicDelete"></a>    
#### soar.del(tbName, query, cb)
Deleting entries from a table. 'query' specifies which entries will be deleted.

Example:

    soar.del('Person', {psnID: 1}, cb);
    
**query** is a query object specifying query conditions. Please refer to this [short article](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) to see how to use query objects effectively.

<a name="runsql"></a>    
#### soar.runSql(conn, sql, parameters, cb)
This function can be used to run SQL statements directly. Even though SOAR provides quite a few handy functions to access databases, sometimes you may still need to manually build a SQL statement and execute it.
In such cases, you can use this function.

The _conn_ argument is the database connection. It's optional. You'll pass in a connecton argument mostly because you want to do transactions.
The _sql_ argument is the SQL statement to be executed, and _parameters_ are data to be filled into the SQL statement (if the given SQL statement is a prepared statement).
Finally _cb_ is the callback function.

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
                op: 'insert',
                expr: expr,
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
If you want to know what SQLs are actually generated by **soar**, you can turn on debug messages as shown below:

    soar.setDebug( true );

That will display generated SQL along with other debug information in console.

Sometimes dumping SQLs of every database query could be overwhelming. You can choose to print oup a specific query by setting the 'debug' property of a **soar** command to true (this feature only works for the _execute()_ function). For example:

    var  cmd = {
            op: 'list',
            expr: expr,
            debug: true    // set to 'true' will print out SQL
         };
         
    soar.execute(cmd, query, cb);

## Regarding Tests
The **soar** package comes with some test files. To run those tests, sample data have to be built first. Inside the "doc" directory there are two files: schema.sql and sampleData.sql. Those two files can be used to build the sample data. In addition, remember to change the user name and password in your config.json file and the related database settings in the test programs.

## Supported Database
In the current release, **soar** only supports mySQL. If you want to use **soar** for other databases such as Postgre, MS SQL server or Oracle DB, etc, you'll have to write your own SQL generator. Right now SQL generation is implemented by ./lib/sqlGenMySql.js. 
