define(function(require, exports, module){
	var b = require('b');
	var d = require('d');
	exports.name = 'C';
	exports.sayHi = function(){
		debug('I am C. I have two friends, one is ' + b.name + ', another one...');
		d.sayHi();
	};
});
