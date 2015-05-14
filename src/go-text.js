/**
 * go-text.js
 * https://github.com/Lanfei/GoJS
 * A plugin for GoJS to load text files
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

	function textLoader(uri, expose) {
		var xhr = createStandardXHR() || createActiveXHR();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if(xhr.status == 200){
					expose(xhr.responseText);
				}else{
					expose();
				}
			}
		};
		xhr.open('GET', uri, true);
		xhr.send();
	}

	gojs.config({
		loaders: [
			[/\.(txt|html)$/, textLoader]
		]
	});
})();