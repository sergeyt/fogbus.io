req = require 'request'

req 'http://localhost:7777/fogbugz/events/case12345', (err, res, body) ->
	console.log body