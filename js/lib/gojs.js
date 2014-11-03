/**
 * GoJS 1.1.0
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
		version: '1.1.0'
	};

	// path
	var DOT_RE = /\/\.\//g;
	var MULTI_SLASH_RE = /([^:/])\/+\//g;
	var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;

	var PROTOCOL_RE = /^(http:|https:|file:)?\/\//;

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
			map: {},
			base: '',
			main: '',
			debug: false,
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
			var base = config['base'];
			if (!PROTOCOL_RE.test(base)) {
				base = dirname(document.location.href) + base;
			} else if (base.indexOf('//') === 0) {
				base = document.location.protocol + base;
			}
			if (base.slice(-1) !== '/') {
				base += '/';
			}
			config['base'] = base;
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
	var loadedMap = {},
		moduleMap = {},
		fetchingList = [],
		asyncList = [],
		currentScript = '',
		isSync = false,
		syncQueue = [],
		head = document.head || document.getElementsByTagName('head')[0];

	window.moduleMap = moduleMap;

	function getCurrentScript() {

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

	function id2Uri(id, referer) {
		var uri = id;
		if (referer && id.indexOf('.') === 0) {
			uri = normPath(dirname(referer) + id);
		} else if (!PROTOCOL_RE.test(id)) {
			uri = normPath(config.base + id);
		} else if (uri.indexOf('//') === 0) {
			uri = document.location.protocol + uri;
		}
		if (!/\.js($|\?)/.test(uri)) {
			uri += '.js';
		}
		return uri;
	}

	function uri2Id(uri) {
		var id = uri.replace(config.base, '');
		if (!PROTOCOL_RE.test(id)) {
			id = './' + id;
		}
		if (id.slice(-3) === '.js') {
			id = id.substring(0, id.length - 3);
		}
		return id;
	}

	function resolveMap(id, referer) {
		var uri = id2Uri(id, referer),
			map = config['map'],
			list;
		if (!config.debug && map) {
			for (var key in map) {
				list = map[key];
				for (var i = 0, l = list.length; i < l; ++i) {
					if (id2Uri(list[i]) === uri) {
						return id2Uri(key);
					}
				}
			}
		}
		return uri;
	}

	function loadModule(id, referer) {

		var uri = resolveMap(id, referer);

		if (loadedMap[uri]) {
			return;
		}

		var script = document.createElement('script');
		script.src = uri;
		script.charset = config.charset;
		script.async = true;

		// Sync
		if (getCurrentScript() && isSync) {
			syncQueue.push(uri);
			return;
		}
		currentScript = uri;
		loadedMap[uri] = true;

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

	function requireFactory(uri) {
		var require = function(id) {
			return moduleMap[id2Uri(id, uri)];
		};

		require.resolve = function(id) {
			return id2Uri(id, uri);
		};

		require.async = function(deps, callback) {
			if (typeof deps == 'string') {
				deps = [deps];
			}
			for (var i = 0, l = deps.length; i < l; ++i) {
				loadModule(deps[i], uri);
			}
			asyncList.push({
				deps: deps || [],
				referer: uri,
				callback: callback
			});
		};

		return require;
	}

	function checkAsync() {
		for (var i = 0, l = asyncList.length; i < l; ++i) {
			var args = [],
				item = asyncList[i],
				deps = item.deps,
				referer = item.referer,
				callback = item.callback;

			for (var j = 0, depLen = deps.length; j < depLen; ++j) {
				var uri = id2Uri(deps[j], referer);
				var factory = moduleMap[uri];
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

	function parseDeps(factory) {
		var re = /(^|\b)(?!_)require\( *[\'\"][^\'\"]+[\'\"] *\)/g,
			code = factory.toString(),
			// code = code.replace(/\/\/.*/g, ''),
			deps = code.match(re) || [];

		for (var i = 0, l = deps.length; i < l; ++i) {
			deps[i] = deps[i].replace(/require\( *[\'\"]([^\'\"]+)[\'\"] *\)/, '$1');
		}

		return deps;
	}

	function resolveDeps() {
		var len = fetchingList.length;
		if (!len) {
			return;
		}

		var loaded, factory, require, exports, module, id, uri, deps, depUri;
		for (var i = len - 1; i >= 0; --i) {
			loaded = true;
			module = fetchingList[i];
			id = module.id;
			uri = module.uri;
			factory = module.factory;
			deps = module.dependencies;

			for (var j = 0, l = deps.length; j < l; ++j) {
				depUri = id2Uri(deps[j], uri);
				if (!moduleMap[depUri]) {
					loaded = false;
					break;
				}
			}

			if (loaded) {
				require = requireFactory(uri);
				exports = factory(require, module.exports, module);
				moduleMap[uri] = exports || module.exports;
				fetchingList.splice(i, 1);
				checkAsync();
				resolveDeps();
				return;
			}
		}
	}

	global.define = function(factory) {
		var uri = getCurrentScript(),
			id = uri2Id(uri);

		if (!config.debug) {
			var index,
				list = config.map[id];
			if (!list && id.indexOf('./') === 0) {
				list = config.map[id.slice(2)];
			}
			if (list) {
				index = list.index || 0;
				id = list[index];
				uri = id2Uri(id);
				list.index = index + 1;
			}
		}

		if (typeof factory === 'function') {
			var module = {},
				deps = parseDeps(factory);
			module.id = id;
			module.uri = uri;
			module.exports = {};
			module.factory = factory;
			module.dependencies = deps;

			for (var i = 0, l = deps.length; i < l; ++i) {
				loadModule(deps[i], uri);
			}

			fetchingList.push(module);
		} else {
			moduleMap[uri] = factory;
			checkAsync();
		}

		resolveDeps();
	};

	global.define.cmd = {};

	if (config.main) {
		loadModule(config.main, absSrc(goScript));
	}

})(this);