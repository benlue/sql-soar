# Query Object

Specifying query conditions of database actions (query, update or delete) is the place where we can easily introduce bugs to our programs. In this short article, a more expressive while less error-prone presentation of query conditions is described.

## The column-value pair
A query object is a JSON object containing query values. Its basic format is an object of column-value pairs which can make up the WHERE clause of a SQL statement. Considering the query object below:

    {zipcode: '94604'}
    
That can be translated into something like:

    WHERE zipcode = '94604'
    
With a very simple format, a query object can actually express most (if not all) of the query conditions. We'll explain how.

The above example shows how to represent a single-value query condition. What if we want to specify multiple conditions? The answer is to specify multiple properties in a query object. The effect is to "AND" all the properties. For example, if we have a query object like:

    {
      zipcode: '94604',
      rooms: 3
    }
    
the WHERE clause will become:

    WHERE zipcode = '94604' AND rooms = 3
    
That seems to be good, but what if we need comparators other than '=' (equal) ? The format can be extended a bit so we can specify needed operators as shown below:

    {colName: {op: 'the_comparator', value: x}}
    
Assuming we want to query houses having more than 3 bedrooms in a specific area, below is what we can do:

    {
      zipcode: '94604',
      rooms: {op: '>', value: 3}
    }
    
If you need to "OR" properties instead of "AND", you just need to specify 'or' as the property key and a query object as its value:

    {
      or: a_query_object
    }
    
For example, if you want to query houses costing less than $400,000 or having only 2 bedrooms, you can specify the query condition this way:

    {
      or: {
          price: {op: '<', value: 400000},
          rooms: 2
      }
    }
    
Pretty smart, isn't it? Up to this point, you probably have already known how to make compounded queries. You jsut have to specify 'or' or 'and' as the property name with yet another query object as the property value. Check this example:

    {
      and: {
          zipcode: '94604',
          or: {
              cost: {op: '<', value: 400000},
              rooms: 2
          }
      }
    }
    
That can produce a WHERE clause like:

    WHERE zipcode = '94604' AND
          (cost < 400000 OR rooms = 2)
          
We can even make that query object more concise:

    {
      zipcode: '94604',
      or: {
          cost: {op: '<', value: 400000},
          rooms: 2
      }
    }
    
As logic "AND" is the default behavior when a query object has multiple properties.

## Implementations
[sql-soar]() and [newsql]() allow developers using query objects to specify query conditions.