define(function(require){

	var println = require('../println');

	// Load `foo` in async mode
	require.async('./foo', function(foo){
		println('Async loading: foo.bar = "' + foo.bar + '"');
	});

});
