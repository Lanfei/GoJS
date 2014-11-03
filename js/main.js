gojs.config({
	// debug: true,
	map: {
		ef: ['e', 'f']
	}
});

define(function(require, exports, module) {

	var $ = require('lib/jquery');
	window.debug = function(msg){
		$('#log').append(msg + '<br>');
	};

	var a = require('a');
	var b = require('b');
	var c = require('c');

	debug('Main module: ' + module.id);

	debug(a);
	b.sayHi();
	c.sayHi();
});
