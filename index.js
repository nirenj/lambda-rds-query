const AWS = require('aws-sdk');
var mysql = require('mysql');

// create cache
var MemoryCache = require('fast-memory-cache');
var cache = new MemoryCache();

var DBPasswd = process.env.DB_PASSWD;

function processQuery(event, context, callback) {
  let cached = cache.get(event.query);

  if (cached) {
    return callback(null, cached);
  }

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
          cache.set(event.query, results, 60);
          callback(null,results);
        }
      });
    } else {
      callback('Must specify "query"',null);
    }
  }
}

exports.handler = (event, context, callback) => {
  if (DBPasswd) {
    processQuery(event, context, callback);
  } else {
    const kms = new AWS.KMS();
    kms.decrypt({ CiphertextBlob: new Buffer(EncryptedDBPasswd, 'base64') }, (err, data) => {
      if (err) {
        console.log('Decrypt error:', err);
        return callback(err);
      }
      DBPasswd = data.Plaintext.toString('ascii');
      processQuery(event, context, callback);
    });
  }
};
