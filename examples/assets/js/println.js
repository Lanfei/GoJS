define(function() {

	document.body.innerHTML += '<div id="content"><h1>' + document.title + '</h1></div>';

	return function(msg) {
		document.getElementById('content').innerHTML += '<p>' + (msg || '') + '</p>';
	};

});