const AWS = require('aws-sdk');
var mysql = require('mysql');

var EncryptedDBPasswd = process.env.DB_PASSWD;
var DBPasswd;

function processQuery(event, context, callback) {

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
        timeout: 10000
      },function(error, results, fields){
        db_connection.end();
        if (error) {
          callback(error,null);
        } else {
          callback(null,results);
        }
      });  
    } else {
      callback('Must specify "query"',null);
    }
  }
}

exports.handler = (event, context, callback) => {
  if (decrypted) {
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
