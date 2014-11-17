define(function(require, exports, module){

	var println = require('../println');

	return {
		println: function(){
			println('项目上线时，我们通常需要通过压缩合并模块文件来减少HTTP连接数，这时可以通过 map 选项来配置模块地址映射。');
			println('When the project is released, we usually need to reduce HTTP connections by compressing and merging module files, then we can use "map" option to configure the mapping of modules.');
		}
	};

});
