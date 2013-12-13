var express = require('express'),
		sockjs = require('sockjs'),
		http = require('http');

// sockjs server
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

var sock_connections = {};
var sock = sockjs.createServer(sockjs_opts);
sock.on('connection', function(conn) {
	sock_connections[conn.id] = conn;

	conn.on('close', function() {
		delete sock_connections[conn.id];
		console.log('bus> close ' + conn);
	});

	conn.on('data', function(m) {
		broadcast(m);
	});
});

// sends given message to all active sockjs connections
function broadcast(m) {
	console.log('bus> broadcast message:', m);
	var s = JSON.stringify(m);
	for (var id in sock_connections) {
		sock_connections[id].write(s);
	}
}

// express server
var app = express();
var server = http.createServer(app);

sock.installHandlers(server, {prefix: '/fogbus'});

// configure express
app.set('port', process.env.PORT || 80);

// https://gist.github.com/jonsullivan/3126319
// http://stackoverflow.com/questions/11001817/allow-cors-rest-request-to-a-express-node-js-application-on-heroku
function corsHandler(req, res, next) {
	// console.log('allowingCrossDomain');
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization, X-Mindflash-SessionID');

	// intercept OPTIONS method
	if ('OPTIONS' == req.method) {
		res.send(200);
	} else {
		next();
	}
}

app.configure(function() {
	// config middleware
	app.use(corsHandler);
	app.use(express.logger({ format: 'dev' }));
	app.use(express.compress());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.bodyParser());

	// static files
	var dirs = ['js'];
	for (var i = 0; i < dirs.length; i++) {
		app.use('/' + dirs[i], express.static(__dirname + '/' + dirs[i]));
	}
});

function requestInfo(req){
	return {
		url: req.url,
		ip: req.ip,
		ips: req.ips,
		headers: req.headers
	};
}

function eventHandler(req, res, type){
	var id;
	var from = req.query.from || '';
	var event = req.query.event || type;

	if (req.params.case){
		id = (/case(\d+)/gi).exec(req.params.case)[1];
	} else {
		id = req.params.id;
	}

	var msg = {
		event: event,
		from: from,
		id: id,
		request: requestInfo(req),
		body: req.body
	};

	console.log('[fogbus] %s event about %s from %s', type, id, from);

	broadcast(msg);
	res.send('ok');
}

function caseEventHandler(req, res){
	eventHandler(req, res, 'case');
}

function milestoneEventHandler(req, res){
	eventHandler(req, res, 'milestone');
}

app.get('/', function(req, res) {
	res.sendfile(__dirname + '/index.html');
});
app.get('/fogbugz/events/:case', caseEventHandler); // TODO remove
app.get('/case/:id', caseEventHandler);
app.get('/milestone/:id', milestoneEventHandler);

// error handler
app.use(function(req, res, next) {
	res.send(404, 'Sorry, cant find that!');
});

// start the web server
var port = app.get('port');
server.listen(port);
console.log('Listening on port ' + port);
