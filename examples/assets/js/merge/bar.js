define(function(require, exports, module){

	var uri = module.uri;

	return {
		text_cn: 'bar 模块虽然与 foo 模块合并了，但它的 uri 属性仍与开发时保持一致：' + uri,
		text_en: 'Module "bar" was merged with module "foo", but the "uri" property is still the same as it under development: ' + uri
	};

});