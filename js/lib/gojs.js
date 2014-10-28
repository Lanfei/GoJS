/**
 * GoJS 1.0.0
 * https://github.com/Lanfei/GoJS
 * A JavaScript module loader following CMD standard
 * [Common Module Definition](https://github.com/cmdjs/specification/blob/master/draft/module.md)
 */

(function(global, undefined) {

	// global
	if (global.gojs) {
		return;
	}

	var gojs = global.gojs = {
		version: '1.0.0'
	};

	// path
	var DOT_RE = /\/\.\//g;
	var MULTI_SLASH_RE = /([^:/])\/+\//g;
	var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;

	function normPath(path) {
		path = path.replace(DOT_RE, '/');

		path = path.replace(MULTI_SLASH_RE, '$1/');

		while (path.match(DOUBLE_DOT_RE)) {
			path = path.replace(DOUBLE_DOT_RE, '/');
		}
		return path;
	}

	function dirname(path) {
		return path.match(/[^?#]*\//)[0];
	}

	function absSrc(script) {
		return script.hasAttribute ? script.src : script.getAttribute('src', 4);
	}

	// config
	var config = {
			base: undefined,
			main: undefined,
			charset: 'utf-8'
		},
		scripts = document.scripts,
		goScript = scripts[scripts.length - 1],
		data = goScript.dataset;

	gojs.config = function(data) {
		if (data) {
			for (var key in config) {
				config[key] = data[key] || config[key];
			}
			if (config['base'] === undefined) {
				config['base'] = dirname(absSrc(goScript));
			}
			if (config['base'] && config['base'].slice(-1) !== '/') {
				config['base'] += '/';
			}
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

	gojs.config(data);

	// loader
	var modules = {},
		fetchingList = [],
		asyncList = [],
		currentScript = '',
		isSync = false,
		syncQueue = [],
		head = document.head || document.getElementsByTagName('head')[0];

	window.modules = modules;

	function getCurrentScript() {
		var scripts = head.getElementsByTagName('script');

		// Chrome
		if (document.currentScript) {
			return absSrc(document.currentScript);
		}

		// Safari, etc.
		if (isSync) {
			return currentScript;
		}

		// Opera 9, etc.
		try {
			throwAnError();
		} catch (e) {
			var stack = e.stack;
			// Opera 9 or lower
			if (e.stacktrace) {
				stack = e.toString();
			}
			if (stack) {
				var reg = /(http|https|file):\/\/[^ ]+\.js/g;
				var matches = stack.match(reg);
				return matches.pop();
			}
		}

		// IE 6-9
		for (var i = 0, l = scripts.length; i < l; ++i) {
			var script = scripts[i];
			if (script.readyState === 'interactive') {
				return absSrc(script);
			}
		}

		isSync = true;

		return currentScript;
	}

	function loadModule(id) {
		if (modules[id]) {
			return;
		}

		var uri = id2Uri(id),
		script = document.createElement('script');
		script.src = uri;
		script.charset = config.charset;
		script.async = true;

		// Sync
		if (getCurrentScript() && isSync) {
			syncQueue.push(id);
			return;
		}
		currentScript = uri;

		// setTimeout: IE6
		setTimeout(function() {
			script.onload = script.onreadystatechange = function() {
				if (!script.readyState || /loaded|complete/.test(script.readyState)) {
					script.onload = script.onreadystatechange = null;
					head.removeChild(script);
					script = null;
				}
				currentScript = '';
				if (isSync && syncQueue.length) {
					loadModule(syncQueue.shift());
				}
			};
			head.insertBefore(script, head.firstChild);
		});
	}

	function id2Uri(id) {
		var uri = id;
		if (!/^(http|https|file):\/\//.test(id)) {
			uri = normPath(dirname(document.location.href) + config.base + id);
		}
		if (uri.slice(-3) !== '.js') {
			uri += '.js';
		}
		return uri;
	}

	function uri2Id(uri) {
		var base = normPath(dirname(document.location.href) + config.base);
		var id = uri.replace(base, '');
		if (id.slice(-3) === '.js') {
			id = id.substring(0, id.length - 3);
		}
		return id;
	}

	function require(uri) {
		return modules[uri2Id(uri)];
	}

	require.async = function(uris, callback) {
		var id, deps = [];
		if (typeof uris == 'string') {
			uris = [uris];
		}
		for (var i = 0, l = uris.length; i < l; ++i) {
			id = uri2Id(uris[i]);
			deps.push(id);
			loadModule(id);
		}
		asyncList.push({
			deps: deps,
			callback: callback
		});
		// checkAsync();
	};

	require.resolve = id2Uri;

	function checkAsync() {
		for (var i = 0, l = asyncList.length; i < l; ++i) {
			var args = [],
				deps = asyncList[i].deps,
				callback = asyncList[i].callback;

			for (var j = 0, depLen = deps.length; j < depLen; ++j) {
				var factory = modules[deps[j]];
				if (!factory) {
					break;
				}
				args.push(factory);
				if (args.length === depLen) {
					break;
				}
			}

			if (args.length === depLen) {
				callback.apply(null, args);
				asyncList.splice(i, 1);
				--i;
				--l;
			}
		}
	}

	function resolveDeps() {
		var len = fetchingList.length;
		if (!len) {
			return;
		}

		var loaded, module, uri, factory, deps, exports;
		for (var i = len - 1; i >= 0; --i) {
			loaded = true;
			module = fetchingList[i];
			id = module.id;
			uri = module.uri;
			factory = module.factory;
			deps = module.dependencies;

			for (var j = 0, l = deps.length; j < l; ++j) {
				if (!modules[deps[j]]) {
					loaded = false;
					break;
				}
			}

			if (loaded) {
				exports = factory(require, module.exports, module);
				modules[id] = exports || module.exports;
				fetchingList.splice(i, 1);
				checkAsync();
				resolveDeps();
				return;
			}
		}
	}

	function parseDeps(code) {
		var re = /(^|\b)(?!_)require\( *[\'\"][^\'\"]+[\'\"] *\)/g,
			// matches = code.replace(/\/\/.*/g, '').match(re) || [],
			matches = code.match(re) || [],
			deps = [];

		for (var i = 0, l = matches.length; i < l; ++i) {
			matches[i] = uri2Id(matches[i].replace(/require\( *[\'\"]([^\'\"]+)[\'\"] *\)/, '$1'));
		}

		return matches;
	}

	global.define = function(factory) {
		var uri = getCurrentScript(),
			id = uri2Id(uri);
		if (typeof factory === 'function') {
			var module = {},
				deps = parseDeps(factory.toString());
			module.id = id;
			module.uri = uri;
			module.exports = {};
			module.factory = factory;
			module.dependencies = deps;

			for (var i = 0, l = deps.length; i < l; ++i) {
				loadModule(deps[i]);
			}

			fetchingList.push(module);
		} else {
			modules[id] = factory;
			checkAsync();
		}

		resolveDeps();
	};

	global.define.cmd = {};

	if (config.main) {
		loadModule(config.main);
	}

})(this);