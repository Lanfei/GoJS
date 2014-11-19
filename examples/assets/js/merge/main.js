define(function(require){

	var println = require('../println');
	var foo = require('./foo');

	println('foo.bar = "' + foo.bar + '"');

});
