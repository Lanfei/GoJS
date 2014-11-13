define(function() {

	document.body.innerHTML += '<pre id="content" style="white-space: normal;"></pre>';

	return function(msg) {
		document.getElementById('content').innerHTML += '<p>' + (msg || '') + '</p>';
	};

});