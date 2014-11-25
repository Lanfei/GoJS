define(function(require, exports) {

	function initPage() {
		require('../../css/login.css');
		
		var node = document.createElement('div');
		node.id = 'login';
		node.innerHTML = '<h2>Sign in</h2><form><input type="text" placeholder="Username or Email"><input type="password" placeholder="Password"><br><button type="submit">Sign in</button><button id="close" type="button">Close</button></form>';
		document.body.appendChild(node);
	}

	function initEvent() {
		document.getElementById('close').onclick = function() {
			document.getElementById('login').style.display = 'none';
		};
	}

	function show() {
		document.getElementById('login').style.display = 'block';
	}

	exports.show = show;

	initPage();
	initEvent();

});
