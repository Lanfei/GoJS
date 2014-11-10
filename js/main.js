gojs.config({
	// debug: true,
	// paths in map are based on the path of gojs
	map: {
		'../e-f.min': ['../e', '../f']
	}
});

define(function(require, exports, module) {

	var $ = require('./lib/jquery');
	var a = require('./a');
	var b = require('./b');
	var c = require('./c');

	$('body').prepend('<pre id="log"></pre>');

	window.debug = function(msg){
		$('#log').append(msg + '<br>');
	};

	debug('Main module: ' + module.id);
	debug(a);
	b.sayHi();
	c.sayHi();
});
