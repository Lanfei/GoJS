/**
 * GoJS 1.1.0
 * https://github.com/Lanfei/GoJS
 * A JavaScript module loader following CMD standard
 * [Common Module Definition](https://github.com/cmdjs/specification/blob/master/draft/module.md)
 */

(function(global, undefined) {

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
		scripts = document.scripts,
		goScript = scripts[scripts.length - 1],
		dataset = goScript.dataset;

	// config function
	gojs.config = function(data) {
		if (data === undefined) {
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
		if (main) {
			gojs.config({
				main: main
			});
		}
		loadModule(id2Uri(config.main, absSrc(goScript)));
	};

	// read dataset in old browers
	if (dataset === undefined) {
		dataset = {};
		var attrs = goScript.attributes;
		for (var i = 0, l = attrs.length; i < l; ++i) {
			var item = attrs[i],
				nodeName = item.nodeName,
				nodeValue = item.nodeValue;

			if (nodeName.indexOf('data-') === 0) {
				dataset[nodeName.replace('data-', '')] = nodeValue;
			}
		}
	}

	// save config in dataset
	gojs.config(dataset);

	// Loader
	var loadedMap = {},
		moduleMap = {},
		waitingMap = {},
		syncQueue = [],
		isSync = false,
		currentScript = '',
		head = document.head || document.getElementsByTagName('head')[0];

	// get the url of defining script
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
		if (id.slice(-3) === '.js') {
			id = id.substring(0, id.length - 3);
		}
		return id;
	}

	// search the uri of merged files
	function resolveUriMap(uri) {
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

		// create a module object by uri
		if (!moduleMap[uri]) {
			moduleMap[uri] = {
				id: uri2Id(uri),
				uri: uri,
				factory: null,
				exports: null,
				dependencies: null,
				remains: 0
			};
		}

		// get the real uri in map
		if (!config.debug) {
			uri = resolveUriMap(uri);
		}

		// prevent multiple loading
		if (loadedMap[uri]) {
			return;
		}
		loadedMap[uri] = true;

		// sync mode
		if (getCurrentScript() && isSync) {
			syncQueue.push(uri);
			return;
		}
		currentScript = uri;

		// create script element
		var script;
		script = document.createElement('script');
		script.src = uri;
		script.charset = config.charset;
		script.async = true;

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

		// require function
		var require = function(id) {
			var uri = id2Uri(id, uri);
			return moduleMap[uri].exports;
		};

		// convert ID to URI according to current script
		require.resolve = function(id) {
			return id2Uri(id, uri);
		};

		// load module in async mode
		require.async = function(ids, callback) {
			var deps = [],
				depUri;

			if (typeof ids == 'string') {
				ids = [ids];
			}

			callback.deps = deps;
			callback.remains = ids.length;

			// load dependencies and update waiting map
			for (var i = 0, l = ids.length; i < l; ++i) {
				depUri = id2Uri(ids[i], uri);
				loadModule(depUri);
				waitingMap[depUri] = waitingMap[depUri] || [];
				waitingMap[depUri].push(callback);
				deps.push(depUri);
			}
		};

		return require;
	}

	// execute callback function
	function emitCallback(callback) {
		var args = [],
			deps = callback.deps;
		for (var i = 0, l = deps.length; i < l; ++i) {
			args.push(moduleMap[deps[i]].exports);
		}
		delete callback.deps;
		delete callback.remains;
		callback.apply(null, args);
	}

	// call this function when module is loaded
	function emitload(module) {
		var uri = module.uri,
			factory = module.factory,
			require, exports;

		// reduce memory
		delete module.remains;

		if (typeof factory === 'function') {
			require = requireFactory(uri);
			exports = factory(require, module.exports, module);
			module.exports = exports || module.exports;
		}

		// 
		var waiting,
			waitingList = waitingMap[uri];
		if (waitingList) {
			// reduce memory
			delete waitingMap[uri];
			for (var i = 0, l = waitingList.length; i < l; ++i) {
				waiting = waitingList[i];
				if (--waiting.remains === 0) {
					if (typeof waiting === 'function') {
						emitCallback(waiting);
					} else {
						emitload(waiting);
					}
				}
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

	// save module and check dependencies
	function saveModule(uri, factory) {
		var module = moduleMap[uri],
			exports, deps;

		if (typeof factory === 'function') {
			exports = {};
			deps = parseDeps(factory);
		} else {
			exports = factory;
			deps = [];
		}

		module.factory = factory;
		module.exports = exports;
		module.dependencies = deps;
		module.remains = deps.length;

		for (var i = 0, l = deps.length; i < l; ++i) {
			var depUri = id2Uri(deps[i], uri),
				depModule = moduleMap[depUri];
			if (depModule && depModule.remains === undefined) {
				--module.remains;
			} else {
				loadModule(depUri);
				waitingMap[depUri] = waitingMap[depUri] || [];
				waitingMap[depUri].push(module);
			}
		}
		if (module.remains === 0) {
			emitload(module);
		}
	}

	// define a module
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

		saveModule(uri, factory);
	};

	global.define.cmd = {};

	if (config.main) {
		gojs.init();
	}

})(this);