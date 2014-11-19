define(function() {

	document.body.innerHTML += '<div id="content"></div>';

	return function(msg) {
		document.getElementById('content').innerHTML += '<p>' + (msg || '') + '</p>';
	};

});
