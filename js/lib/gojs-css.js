/**
 * gojs-css.js
 * https://github.com/Lanfei/GoJS
 * A plugin for GoJS to load style files
 */

(function() {
	var config = gojs.config();

	function CSSLoader(uri, callback) {
		var head = document.head || document.getElementsByTagName('head')[0],
		node = document.createElement('link');
		node.rel = 'stylesheet';
		node.href = uri;
		head.insertBefore(node, head.firstChild);
		callback();
	}

	config.loaders['css'] = CSSLoader;
})();
