define(function(require, exports, module) {

	var println = require('../println');
	var def = require('./define');
	var req = require('./require');
	var exp = require('./exports');

	println('<h2>define</h2>');
	println(def.text_cn);
	println(def.text_en);

	println('<h2>require</h2>');
	req.println();

	println('<h2>exports</h2>');
	println(exp.text_cn);
	println(exp.text_en);

	println('<h2>module</h2>');
	println('构造函数中的 module 参数包含了当前模块的信息，如当前模块的标志：' + module.id + '。');
	println('The "module" parameter contains the information of the current module, such as the identification: ' + module.id + '.');

	println('<hr>');
	println('更多模块规范信息，请参考 <a target="_blank" href="https://github.com/seajs/seajs/issues/242">CMD 模块定义规范</a>。');
	println('For more information about the module standard, please see <a target="_blank" href="https://github.com/cmdjs/specification/blob/master/draft/module.md">Common Module Definition</a>。');
});