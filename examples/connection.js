const mysql = require("mysql");
const {PLimited} = require("plimited");
const {MySQLFiles} = require('mysqlfiles');

const pool = new PLimited({
  limit: 10,
  ttl: 60 * 10,
  construct() {
    return mysql.createConnection({
      user: 'root',
      password: '',
      connection: ''
    })
  },

  destruct(conn) {
    conn.close();
  }
});

const connection = {
  async query(sql, args, callback) {
    const conn = await pool.acquire();
    conn.get().query(sql, args, (err, ret) => {
      conn.free();
      callback(err, ret);
    })
  }
};


const meta = new MySQLFiles(connection, 'image_store_001_meta');
const store = new MySQLFiles(connection, 'image_store_001');
const mini = new MySQLFiles(connection, 'image_store_001_mini');
const med = new MySQLFiles(connection, 'image_store_001_med');

module.exports = {
  connection,
  store,
  meta,
  mini,
  med
};
