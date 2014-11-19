define(function() {

	return function(msg) {
		document.body.innerHTML += '<p>' + (msg || '') + '</p>';
	};

});
