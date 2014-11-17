gojs.config({
	map: {
		'./foo-bar.min': ['./foo', './bar']
	}
});

define(function(require){
	
	var println = require('../println');
	var foo = require('./foo');
	var bar = require('./bar');

	println('<h2>Module Foo</h2>');
	foo.println();
	println('<h2>Module Bar</h2>');
	println(bar.text_cn);
	println(bar.text_en);

});
