(function(global, undefined) {

	// global
	if (global.gojs) {
		return;
	}

	var gojs = global.gojs = {
		version: '1.0.0'
	};

	var absSrc = function(script) {
		return script.hasAttribute ? script.src : script.getAttribute('src', 4);
	};

	var dirname = function(path) {
		return path.match(/[^?#]*\//)[0];
	};

	// config
	var config = {
			base: '',
			main: '',
			charset: ''
		},
		scripts = document.scripts,
		goScript = scripts[scripts.length - 1],
		data = goScript.dataseta;

	gojs.config = function(data) {
		if (data) {
			for (var key in config) {
				config[key] = data[key] || config[key];
			}
		}
		if (config['base'] && config['base'].slice(-1) !== '/') {
			config['base'] += '/';
		}
		return config;
	};

	if (!data) {
		data = {};
		var attrs = goScript.attributes;
		for (var i = 0, l = attrs.length; i < l; ++i) {
			var item = attrs[i],
				nodeName = item.nodeName,
				nodeValue = item.nodeValue;

			if (nodeName.indexOf('data-') === 0) {
				data[nodeName.replace('data-', '')] = nodeValue;
			}
		}
	}

	if (data.base === undefined) {
		data.base = dirname(absSrc(goScript));
	}

	gojs.config(data);

	// loader
	var cache = gojs.cache = {},
		head = document.head || document.getElementsByTagName('head')[0];

	var moduleUrl = function(name) {
		return (name[0] !== '/' && name.indexOf(':/') < 0 ? config['base'] : '') + name + (name.slice(-3) !== '.js' ? '.js' : '');
	};

	var request = function(name, callback) {
		var script = document.createElement('script');

		script.onload = script.onreadystatechange = function() {
			if (!script.readyState || /loaded|complete/.test(script.readyState)) {
				script.onload = script.onreadystatechange = null;
				head.removeChild(script);
				callback && callback();
				script = null;
			}
		};
		script.charset = config.charset;
		script.src = moduleUrl(name);

		head.insertBefore(script, head.firstChild);
	};

	var curScript = function() {
		return absSrc(document.currentScript);
	};

	global.define = function(module) {
		var url = curScript();
		cache[url] = module;
	};

	global.require = function( /* module1, ..., moduleN, callback */ ) {
		var num = arguments.length,
			callback = arguments[num - 1],
			args = [], script, url, name, remaining;

		if (typeof callback === 'function') {
			--num;
		} else {
			callback = null;
		}

		remaining = num;

		for (var i = 0; i < num; ++i) {
			name = arguments[i];
			script = document.createElement('script');
			script.src = moduleUrl(name);
			url = absSrc(script);
			args[i] = cache[url];
			if (args[i]) {
				--remaining;
			} else {
				request(name, (function(i, url) {
					return function() {
						--remaining;
						args[i] = cache[url];
						if (!remaining) {
							callback.apply(null, args);
						}
					}
				})(i, url));
			}
			if (!remaining) {
				callback.apply(null, args);
			}
		}
	};

	if (config.main) {
		request(config.main);
		require('a', 'b', 'c', 'http://code.jquery.com/jquery-1.11.1.js', function(a, b, c, d) {
			console.log(a, b, c, $);
		});
	}

})(this);