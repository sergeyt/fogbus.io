var express = require('express');

var app = express();
var server = require('http').createServer(app),
	ioserver = require('socket.ioserver').listen(server);

// socket.io
var io = ioserver.of('/fogbugz').on('connection', function(socket) {
  var address = socket.handshake.address;
  console.log('New connection from ' + address.address + ':' + address.port);
});

// configure express
app.set('port', process.env.PORT || 3333);
app.set('host', 'http://localhost:' + app.get('port'));

app.configure(function() {
  // config middleware
  app.use(express.logger({ format: 'dev' }));
  app.use(express.compress());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.bodyParser());

  // static files
  var dirs = ['', 'css'];
  for (var i = 0; i < dirs.length; i++) {
	app.use('/' + dirs[i], express.static(__dirname + '/' + dirs[i]));
  }
});

// error handler
app.use(function(req, res, next) {
  res.send(404, 'Sorry, cant find that!');
});

app.get('/fogbugz/events/:case', function(req, res){
  // TODO parse event and emit event to socket.io clients
});

// start the web server
var port = app.get('port');
server.listen(port);
console.log('Listening on port ' + port);
