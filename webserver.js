var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");


var port = 8888;

http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname,
      filename = path.join(process.cwd(), uri);

    fs.readFile(filename, function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.end(err + "\n");
        return;
      } else {
        response.writeHead(200);
        response.end(file);
      }
    });

}).listen(port);

console.log("http://localhost:" + port + "/");
