(function(){

	var term;

	// TODO add more presets
	var options = {
		default: Terminal.defaults
	};

	function init(opts){
		if (typeof opts === 'string'){
			opts = options[opts];
		}
		if (!opts){
			opts = options.default;
		}

		term = new Terminal(opts);
		// TODO support custom container
		term.open(document.body);
	}

	function toArray(args){ return [].slice.call(args); }
	// TODO simple fallback without sprintf
	function format(args){ return sprintf.apply(sprintf, toArray(args)); }

	var levels = {
		log: 32,
		warn: 33,
		error: 41,
		debug: 36
	};

	function colorize(msg, name){
		var c = levels[name];
		return '\x1b[' + c + 'm' + msg + '\x1b[m';
	}

	function wrap(name){
		var fn = console[name];
		if (fn) console[name + '_'] = fn; // old function for restore
		console[name] = function(){
			if (fn) fn.apply(console, toArray(arguments));
			var msg = colorize(format(arguments), name);
			term.writeln(msg);
		};
	}

	function unwrap(name){
		var old = console[name + '_'];
		if (!old) return;
		console[name] = old;
		delete console[name + '_'];
	}

	function open(opts){
		init(opts);

		Object.keys(levels).forEach(function(name){
			wrap(name);
		});
	}

	function close(){
		Object.keys(levels).forEach(function(name){
			unwrap(name);
		});

		if (term){
			term.destroy();
			term = null;
		}
	}

	// public api
	console.terminal = function(){
		if (arguments.length === 0){
			open(options.default);
		} else if (arguments.length > 0){
			if (arguments[0] === null){
				close();
			} else {
				open(arguments[0]);
			}
		}
	};

}).call();