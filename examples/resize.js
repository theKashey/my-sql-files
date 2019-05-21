var sharp = require('sharp');

var {connection, store, meta, mini, med} = require('./connection');
var async = require("async.js");

function resize(id, callback) {
  store.get(id)
    .then(({blobData, meta: metaInfo}) => {
      const image = sharp(blobData);

      // resize to 3 presets and stores in DB
      return Promise.all([
        image
          .metadata()
          .then(({width, height}) => meta.put(id, `[${width},${height}]`)),

        image
          .resize(240, 180)
          .withMetadata()
          .jpeg()
          .toBuffer()
          .then((outputBuffer) => med.put(id, outputBuffer, metaInfo)),

        image
          .resize(48, 48)
          .jpeg()
          .toBuffer()
          .then((outputBuffer) => mini.put(id, outputBuffer, metaInfo)),
      ])
    })
    .catch((err) => {
      console.error('resize fail', err);
    })
    .then((all) => {
      callback();
    });
}

// this is abstract code
connection.query(`SELECT sourceId from ${store._db()}.metadata `, [], function (err, lines) {
  async.forEach(lines, function ({sourceId}, callback) {
    console.log('resize', sourceId);
    resize(sourceId, callback);
  }, () => {
    console.log('done');
    connection.end();
  });
});