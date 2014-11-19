define(function(require, exports) {

	var loginElement;

	function initPage() {
		require('../../css/login.css');
		loginElement = document.createElement('div');
		loginElement.innerHTML = '<div id="login" title="click to close">This is a login module with an extra `.css` file.</div>';
		document.body.appendChild(loginElement);
	}

	function initEvent() {
		loginElement.onclick = function() {
			this.style.display = 'none';
		};
	}

	function show() {
		loginElement.style.display = 'block';
	}

	exports.show = show;

	initPage();
	initEvent();

});
