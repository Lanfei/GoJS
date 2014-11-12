define(function(require, exports, module){
	exports.name = 'E';
	exports.sayHi = function(){
		debug('EEE\'s uri is ' + module.uri);
		var f = require('./f');
		f.sayHi();
	};
});
