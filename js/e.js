define(function(require, exports, module){
	exports.name = 'E';
	exports.sayHi = function(){
		debug('I am E...');
		var f = require('f');
		f.sayHi();
	};
});
