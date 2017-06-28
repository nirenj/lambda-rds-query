exports.handler = (event, context, callback) => {
  var mysql = require('mysql');

  var DBPasswd = process.env.DB_PASSWD;

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
          callback(null,results);
        }
      });  
    } else {
      callback('Must specify "query"',null);
    }
  }
};
