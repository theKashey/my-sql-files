// Example  server

const SERVER_PORT = 4444;

const http = require("http");
const url = require("url");

const {store, mini, med} = require('./connection');

function getStore(size) {
  switch (size) {
    case 'large': return store;
    case 'medium': return med;
    case 'mini': return mini;
  }
  return null;
}

function SERVER() {
  function reportError(response, code, error) {
    response.writeHead(code, {
      "Content-Type": 'text/plain'
    });
    response.write(error);
  }

  function onRequest(request, response) {
    const params = url.parse(request.url);
    const query = params.pathname.split('/');

    const source = getStore(query[1]);
    if (!source) {
      reportError(response, 500, 'wrong size');
      response.end();
    } else {
      source
        .get(+query[2])
        .then(file => {
          if (!file) {
            reportError(response, 404, 'file not found');
          } else {
            const {meta, blobData} = file;
            response.writeHead(200, {
              "Content-Type": meta.contentType,
              "Last-Modified": new Date(meta.lastMod * 1000 || Date.now()).toDateString()
            });
            response.write(blobData);
          }
        })
        .catch((err) => {
          reportError(response, 500, 'something went wrong');
          console.error(err);
        })
        .then(() => response.end())
    }
  }

  http.createServer(onRequest).listen(SERVER_PORT);
}

SERVER();