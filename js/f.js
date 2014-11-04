define(function(require, exports, module){
	exports.name = 'F';
	exports.sayHi = function(){
		debug('I am merged with E, but my uri is still ' + module.uri);
	};
});
