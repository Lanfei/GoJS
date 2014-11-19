define(function(require){

	var println = require('../println');

	// Load modules in async mode
	require.async('./foo', function(foo){
		println(foo.bar);
	});

});
