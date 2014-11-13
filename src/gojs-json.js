/**
 * gojs-css.js
 * https://github.com/Lanfei/GoJS
 * A plugin for GoJS to load JSON files
 */

(function() {

	function createStandardXHR() {
		try {
			return new window.XMLHttpRequest();
		} catch (e) {}
	}

	function createActiveXHR() {
		try {
			return new window.ActiveXObject("Microsoft.XMLHTTP");
		} catch (e) {}
	}

	function parseJSON(data) {
		try {
			return (Function('return ' + data))();
		} catch (e) {}
		return {};
	}

	function JSONLoader(uri, callback) {
		var xhr = createStandardXHR() || createActiveXHR();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if(xhr.status == 200){
					callback(parseJSON(xhr.responseText));
				}else{
					callback();
				}
			}
		};
		xhr.open('GET', uri, true);
		xhr.send();
	}

	config.config({
		loaders: {
			css: JSONLoader
		}
	});
})();