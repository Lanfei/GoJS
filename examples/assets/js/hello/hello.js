define(function(require, exports, module) {

	function sayTo(target) {
		document.body.innerHTML = 'Hello, ' + target;
	}

	// 通过 exports 导出接口
	exports.sayTo = sayTo;

	// 或者通过 module.exports 导出整个接口
	// module.exports = {
	// 	sayTo: sayTo
	// };
});
