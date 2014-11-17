define(function(require, exports, module){

	var println = require('../println');

	exports.println = function(){
		println('模块中可以使用 require 函数去引入其它模块，但不支持循环依赖，如 A require B, 同时 B 也 require A。');
		println('The "require" function can be used to import other modules, but circular dependencies are not supported, such as A require B, and B require A at the same time.');
	};

});
