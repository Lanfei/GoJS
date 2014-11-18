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

	function JSONLoader(uri, expose) {
		var xhr = createStandardXHR() || createActiveXHR();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if(xhr.status == 200){
					expose(parseJSON(xhr.responseText));
				}else{
					expose();
				}
			}
		};
		xhr.open('GET', uri, true);
		xhr.send();
	}

	gojs.config({
		loaders: {
			css: JSONLoader
		}
	});
})();