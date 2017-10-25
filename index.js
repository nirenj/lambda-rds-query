query_paged_results_cache = {};

exports.handler = (event, context, callback) => {
  var mysql = require('mysql');
  var sizeof = require('object-sizeof');

  var DBPasswd = process.env.DB_PASSWD;

  var large_query_result_expected = false;
  var large_query_hash = null;
  var large_query_result_page = null;
  var do_response_size = false;

  if (event.keepalive) {
    callback(null,{'alive':true});
  } else {
    var db_connection = mysql.createConnection({
      host     : process.env.DB_HOST,
      user     : process.env.DB_USER,
      password : DBPasswd,
      database : process.env.DB_NAME
    });
    if (event.query) {
      if (event.lqre) {
        large_query_result_expected = true;
        if (event.next_result_page) {
          large_query_result_page = event.next_result_page;
        } else {
          large_query_result_page = 0
        }
        if (event.query_hash) {
          large_query_hash = event.query_hash;
        } else {
          // CALCULATE QUERY HASH
        }
      }

      if (event.return_size) {
        do_response_size = true;
        large_query_result_expected = false;
        large_query_result_page = null;
      }

      if ((large_query_result_page != null) && (large_query_hash in query_paged_results_cache)) {
        var large_query_result_next_page = null;
        if ((large_query_result_page + 1) < query_paged_results_cache[large_query_hash].length ) {
          large_query_result_next_page = (large_query_result_page + 1);
        }
        callback(null,{'results': query_paged_results_cache[large_query_hash][large_query_result_page], 'next_result_page': large_query_result_next_page,'query': event.query, 'query_hash': large_query_hash,'lqre': true});
      }
    
      db_connection.connect();
      db_connection.query({
        sql: event.query,
        timeout: 60000
      },function(error, results, fields){
        db_connection.end();
        if (error) {
          console.log('query error: ' + event.query);
          callback(error,null);
        } else {
          if (large_query_result_expected) {
          // PAGE RESULT AND CACHE
          // RETURN PAGE 
          } else {
            if (do_response_size == 1) {
              callback(null,{'bytes':sizeof(results)});
            } else {
              callback(null,results);
            }
          }
        }
      });  
    } else {
      callback('Must specify "query"',null);
    }
  }
};
