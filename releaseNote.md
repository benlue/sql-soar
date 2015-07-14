1.1.3
=====

+ Bug fix of the runSql() method. If no database connections or database names are given, the previous version would fail to execute.

1.1.2
=====

+ Added the runSql() method to run SQL statements directly when necessary.

1.1.1
=====

+ Fixed a bug which would cause "date" objects unable to be written to db tables.

1.1.0
=====

+ If you use SQL expressions to do query, part of the generated SQL statements will be cached to give better performance.

+ When you do pagination, total of 2 queries will be issued: one to retrieve the actual data and the other one to get the total count. In the new release, the total count of a query will be cached for future use. You can force sql-soar to renew the count by setting "refresh" to ture in the soar command.

1.0.5
=====

+ Allowing SQL expressions built for table joins can be applied to insert, update and delete as well.

+ Added test cases to verify the new feature.

1.0.4
=====

+ When table columns are not specified in the update or delete operations, the prvious version could inlucde not updated columns and try to set their values to "undefined". This bug has been fixed.

1.0.3
=====

+ Supported query objects as a way of specifying query conditions.

+ Added a [document](https://github.com/benlue/sql-soar/blob/master/doc/QueryObject.md) to describe what is a query object.

1.0.2
=====

+ Pagination supported. Besides returning a page-load of data, **soar** will also return the total count of the query.

1.0.1
=====

+ Fixed a bug in update.

+ Added a test case to verify the bug fix.

1.0.0
=====

+ Officially released
