/**
 * GoJS 1.1.0
 * https://github.com/Lanfei/GoJS
 * A JavaScript module loader following CMD standard
 * [Common Module Definition](https://github.com/cmdjs/specification/blob/master/draft/module.md)
 */

(function(global) {

	// GoJS
	if (global.gojs) {
		return;
	}

	var gojs = global.gojs = {
		version: '1.1.0'
	};

	// Path
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

	// Config
	var config = {
			map: {},
			base: '',
			main: '',
			debug: false,
			charset: 'utf-8'
		},
		base,
		uriMap = {},
		initialized = false,
		scripts = document.scripts,
		goScript = scripts[scripts.length - 1],
		dataset = goScript.dataset;

	// config function
	gojs.config = function(data) {
		if (!data) {
			return config;
		}

		for (var key in config) {
			config[key] = data[key] || config[key];
		}

		// normalize base option
		base = config.base;
		if (!PROTOCOL_RE.test(base)) {
			base = dirname(document.location.href) + base;
		} else if (base.indexOf('//') === 0) {
			base = document.location.protocol + base;
		}
		if (base.slice(-1) !== '/') {
			base += '/';
		}

		// normalize map option
		if (!config.debug) {
			var idList, uriList,
				idMap = config.map;
			for (var id in idMap) {
				idList = idMap[id];
				uriList = [];
				for (var i = 0, l = idList.length; i < l; ++i) {
					uriList.push(id2Uri(idList[i]));
				}
				uriMap[id2Uri(id)] = uriList;
			}
		}
	};

	// init GoJS
	gojs.init = function(main) {
		if (!initialized) {
			if (main) {
				gojs.config({
					main: main
				});
			}
			loadModule(id2Uri(config.main, absSrc(goScript)));
			initialized = true;
		}
	};

	// read dataset in old browers
	if (!dataset) {
		dataset = {};
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

	gojs.config(dataset);

	// Loader
	var depMap = {},
		loadedMap = {},
		moduleMap = {},
		asyncList = [],
		fetchingList = [],
		currentScript = '',
		syncQueue = [],
		isSync = false,
		head = document.head || document.getElementsByTagName('head')[0];

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

		// use sync mode if current script is unable to get
		isSync = true;

		return currentScript;
	}

	// convert ID to URI based on referer
	function id2Uri(id, referer) {
		var uri = id;
		if (referer && id.indexOf('.') === 0) {
			uri = normPath(dirname(referer) + id);
		} else if (!PROTOCOL_RE.test(id)) {
			uri = normPath(base + id);
		} else if (uri.indexOf('//') === 0) {
			uri = document.location.protocol + uri;
		}
		if (!/\.js($|\?)/.test(uri)) {
			uri += '.js';
		}
		return uri;
	}

	// convert URI to ID
	function uri2Id(uri) {
		var id = uri.replace(base, '');
		// if (!PROTOCOL_RE.test(id)) {
		// 	id = './' + id;
		// }
		if (id.slice(-3) === '.js') {
			id = id.substring(0, id.length - 3);
		}
		return id;
	}

	// search the uri of merged files
	function resolveMap(uri) {
		for (var key in uriMap) {
			var list = uriMap[key];
			for (var i = 0, l = list.length; i < l; ++i) {
				if (list[i] === uri) {
					return key;
				}
			}
		}
		return uri;
	}

	// load module by uri
	function loadModule(uri) {

		if (!config.debug) {
			uri = resolveMap(uri);
		}

		// prevent multiple loading
		if (loadedMap[uri]) {
			return;
		}

		// create script node
		var script;
		script = document.createElement('script');
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

	// a factory to create require function
	function requireFactory(uri) {

		var require = function(id) {
			return moduleMap[id2Uri(id, uri)];
		};

		require.resolve = function(id) {
			return id2Uri(id, uri);
		};

		// load module in async mode
		require.async = function(ids, callback) {
			var dep, deps = [];
			if (typeof ids == 'string') {
				ids = [ids];
			}
			for (var i = 0, l = ids.length; i < l; ++i) {
				dep = id2Uri(ids[i], uri);
				loadModule(dep);
				deps.push(dep);
			}
			asyncList.push({
				deps: deps,
				callback: callback
			});
		};

		return require;
	}

	// resolve async tasks
	function resolveAsync() {
		for (var i = 0, l = asyncList.length; i < l; ++i) {
			var args = [],
				item = asyncList[i],
				deps = item.deps,
				callback = item.callback;

			for (var j = 0, depLen = deps.length; j < depLen; ++j) {
				var dep = deps[j],
					factory = moduleMap[dep];
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

	// parse the dependencies in factory
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

	// resolve require tasks
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
				resolveAsync();
				resolveDeps();
				return;
			}
		}
	}

	// define a factory
	global.define = function(factory) {
		var uri = getCurrentScript();

		// correct the uri in merged module
		if (!config.debug) {
			var index,
				list = uriMap[uri];
			if (list) {
				index = list.index || 0;
				uri = list[index];
				list.index = index + 1;
			}
		}

		if (typeof factory === 'function') {

			var depUri, module,
				deps = parseDeps(factory);
			module = {};
			module.id = uri2Id(uri);
			module.uri = uri;
			module.exports = {};
			module.factory = factory;
			module.dependencies = deps;
			module._remains = deps.length;

			for (var i = 0, l = deps.length; i < l; ++i) {
				depUri = id2Uri(deps[i], uri);
				depMap[depUri] = depMap[depUri] || [];
				depMap[depUri].push(uri);
				loadModule(depUri);
			}

			fetchingList.push(module);
		} else {
			moduleMap[uri] = factory;

			// TODO

			resolveAsync();
		}

		resolveDeps();
	};

	window.depMap = depMap;

	global.define.cmd = {};

	if (config.main) {
		gojs.init();
	}

})(this);