/**
 * gojs-css.js
 * https://github.com/Lanfei/GoJS
 * A plugin for GoJS to load style files
 */

(function() {
	var config = gojs.config(),
		head = document.head || document.getElementsByTagName('head')[0];

	function CSSLoader(uri, callback) {
		var node = document.createElement('link');
		node.rel = 'stylesheet';
		node.href = uri;
		if ('onload' in node || 'onreadystatechange' in node) {
			node.onload = node.onerror = node.onreadystatechange = function() {
				if (!node.readyState || /loaded|complete/.test(node.readyState)) {
					node.onload = node.onerror = node.onreadystatechange = null;
					callback(node);
				}
			};
		} else {
			callback(node);
		}
		head.insertBefore(node, head.firstChild);
	}

	config.loaders['css'] = CSSLoader;
})();
