/**
 * GoJS 1.2.4
 * https://github.com/Lanfei/GoJS
 * A JavaScript module loader following CMD standard
 * [Common Module Definition](https://github.com/cmdjs/specification/blob/master/draft/module.md)
 */

(function(global, undefined) {

	/**
	 * GoJS
	 */
	if (global.gojs) {
		return;
	}

	var gojs = global.gojs = {
		version: '1.2.4'
	};

	/**
	 * Path
	 */
	var DOT_RE = /\/\.\//g,
		MULTI_SLASH_RE = /([^:/])\/+\//g,
		DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;

	// Normalize a pathname
	function normPath(path) {
		path = path.replace(DOT_RE, '/');

		path = path.replace(MULTI_SLASH_RE, '$1/');

		while (path.match(DOUBLE_DOT_RE)) {
			path = path.replace(DOUBLE_DOT_RE, '/');
		}
		return path;
	}

	// Return the directory name of pathname path
	function dirname(path) {
		return path.match(/[^?#]*\//)[0];
	}

	// Return the absolute path of script element
	function absSrc(script) {
		return script.hasAttribute ? script.src : script.getAttribute('src', 4);
	}

	/**
	 * Config
	 */
	var PROTOCOL_RE = /^(http:|https:|file:)?\/\//;

	var config = {
			base: '',
			map: {},
			vars: {},
			alias: {},
			paths: {},
			preload: [],
			debug: false,
			charset: 'utf-8'
		},
		uriMap = {},
		scripts = document.scripts,
		gojsNode = document.getElementById('gojsnode') || scripts[scripts.length - 1],
		gojsSrc = absSrc(gojsNode);

	// Config function
	gojs.config = function(data) {
		if (data === undefined) {
			return config;
		}

		for (var key in config) {
			config[key] = data[key] || config[key];
		}

		// Normalize base option
		var base = config.base || dirname(gojsSrc);
		if (!PROTOCOL_RE.test(base)) {
			base = dirname(location.href) + base;
		} else if (base.indexOf('//') === 0) {
			base = location.protocol + base;
		}
		if (base.slice(-1) !== '/') {
			base += '/';
		}
		config.base = base;

		// Normalize map option
		if (!config.debug) {
			var idList, uriList,
				idMap = config.map;
			for (var id in idMap) {
				idList = idMap[id];
				uriList = [];
				for (var i = idList.length - 1; i >= 0; --i) {
					uriList.unshift(id2Uri(idList[i], gojsSrc));
				}
				uriMap[id2Uri(id, gojsSrc)] = uriList;
			}
		}
	};

	// Initialize GoJS
	gojs.init = function(ids, callback) {
		async(config.preload, function() {
			async(ids, callback, location.href);
		});
	};

	// Save config in dataset
	gojs.config({
		base: gojsNode.getAttribute('data-base'),
		debug: gojsNode.getAttribute('data-debug') === 'true'
	});

	/**
	 * Loader
	 */
	var moduleMap = {},
		loadedMap = {},
		syncQueue = [],
		isSync = false,
		currentScript = '',
		head = document.head || document.getElementsByTagName('head')[0];

	// Return the url of defining script
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

		// Use sync mode if current script is unable to get
		isSync = true;

		return currentScript;
	}

	// Convert ID to URI based on referer
	function id2Uri(id, referer) {
		var uri = config.alias[id] || id,
			paths = config.paths,
			vars = config.vars,
			key;

		// Parse paths
		for (key in paths) {
			if (uri.indexOf(key + '/') === 0) {
				uri = uri.replace(key, paths[key]);
				break;
			}
		}

		// Parse vars
		for (key in vars) {
			if (uri.indexOf('{' + key + '}') >= 0) {
				uri = uri.replace('{' + key + '}', vars[key]);
			}
		}

		if (referer && uri.indexOf('.') === 0) {
			uri = normPath(dirname(referer) + uri);
		} else if (uri.indexOf('//') === 0) {
			uri = location.protocol + uri;
		} else if (uri.indexOf('/') === 0) {
			uri = location.href.replace(/^(.*?\/\/.*?)\/.*/, '$1') + uri;
		} else if (!PROTOCOL_RE.test(uri)) {
			uri = normPath(config.base + uri);
		}
		if (uri.slice(-1) === '#') {
			uri = uri.substring(0, uri.length - 1);
		} else if (uri.indexOf('?') < 0 && !/(\.js|\/)$/.test(uri)) {
			uri += '.js';
		}
		return uri;
	}

	// Convert URI to ID
	function uri2Id(uri) {
		var id = uri.replace(config.base, '');
		if (id.slice(-3) === '.js') {
			id = id.substring(0, id.length - 3);
		}
		return id;
	}

	// Parse the mapping uri
	function parseMap(uri) {
		for (var key in uriMap) {
			var list = uriMap[key];
			for (var i = list.length - 1; i >= 0; --i) {
				if (list[i] === uri) {
					return key;
				}
			}
		}
		return uri;
	}

	// Load module by uri
	function loadModule(uri) {
		var module = moduleMap[uri];

		// Initialize module
		if (module === undefined) {
			module = moduleMap[uri] = {
				id: uri2Id(uri),
				uri: uri,
				factory: null,
				exports: null,
				dependencies: null,
				_waitings: [],
				_remains: 0
			};
		}

		// Get the mapping uri
		if (!config.debug) {
			uri = parseMap(uri);
		}

		// Sync mode
		if (getCurrentScript() && isSync) {
			syncQueue.push(uri);
			return module;
		}

		// Prevent multiple loading
		if (loadedMap[uri]) {
			if (syncQueue.length) {
				loadModule(syncQueue.shift());
			}
			return module;
		}
		loadedMap[uri] = true;

		// Create script element
		var script;
		script = document.createElement('script');
		script.src = currentScript = uri;
		script.charset = config.charset;
		script.async = true;

		// Use setTimeout for compatible with IE6
		setTimeout(function() {
			script.onload = script.onerror = script.onreadystatechange = function() {
				if (!script.readyState || /loaded|complete/.test(script.readyState)) {
					script.onload = script.onerror = script.onreadystatechange = null;
					head.removeChild(script);
					script = null;
					currentScript = '';
					// Modules not in CMD standard
					if (module.exports === null) {
						emitload(module);
					}
					// Sync
					if (syncQueue.length) {
						loadModule(syncQueue.shift());
					}
				}
			};
			head.insertBefore(script, head.firstChild);
		});

		return module;
	}

	// Load module in async mode
	function async(ids, callback, referer) {

		if (typeof ids == 'string') {
			ids = [ids];
		}

		var deps = [],
			remains = ids.length,
			depUri, depModule;

		// Load dependencies and update waiting list
		for (var i = ids.length - 1; i >= 0; --i) {
			depUri = id2Uri(ids[i], referer);
			depModule = loadModule(depUri);
			if (callback) {
				if (depModule._remains === undefined) {
					--remains;
				} else {
					depModule._waitings.push(callback);
				}
				deps.unshift(depUri);
			}
		}


		if (callback) {
			callback._deps = deps;
			callback._remains = ids.length;
			if (remains === 0) {
				emitCallback(callback);
			}
		}
	}

	// A factory to create require function
	function requireFactory(uri) {

		// The require function
		function require(id) {
			var module = moduleMap[id2Uri(id, uri)];
			if (module) {
				return module.exports;
			}
		}

		// Convert ID to URI according to current script
		require.resolve = function(id) {
			return id2Uri(id, uri);
		};

		// Load module in async mode according to current script
		require.async = function(ids, callback) {
			async(ids, callback, uri);
		};

		return require;
	}

	// Call this function when callback's dependencies are loaded
	function emitCallback(callback) {
		var args = [],
			deps = callback._deps;

		for (var i = deps.length - 1; i >= 0; --i) {
			args.unshift(moduleMap[deps[i]].exports);
		}

		callback.apply(null, args);

		// Reduce memory
		delete callback._deps;
		delete callback._remains;
	}

	// Call this function when module is loaded
	function emitload(module) {
		var uri = module.uri,
			factory = module.factory,
			waitings = module._waitings,
			require, exports, waiting;

		// Save exports if factory is a function
		if (typeof factory === 'function') {
			require = requireFactory(uri);
			exports = factory(require, module.exports, module);
			module.exports = exports || module.exports;
		}
		// Notify waiting modules or callbacks
		for (var i = waitings.length - 1; i >= 0; --i) {
			waiting = waitings[i];
			if (--waiting._remains === 0) {
				if (typeof waiting === 'function') {
					emitCallback(waiting);
				} else {
					emitload(waiting);
				}
			}
		}

		// Reduce memory
		delete module._waitings;
		delete module._remains;
	}

	// Parse the dependencies in factory
	function parseDeps(factory) {
		var re = /(?:[^\$\w\.])require\( *['"]([^'"]+)['"] *\)/g,
			code = factory.toString(),
			deps = [];

		code.replace(re, function(_, $1) {
			deps.push($1);
		});

		return deps;
	}

	// Save module and resolve dependencies
	function saveModule(uri, factory) {
		var module = moduleMap[uri],
			exports, deps;

		// Update module
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
		module._remains = deps.length;

		// Resolve dependencies
		var depUri, depModule;
		for (var i = deps.length - 1; i >= 0; --i) {
			depUri = id2Uri(deps[i], uri);
			depModule = loadModule(depUri);
			if (depModule._remains === undefined) {
				--module._remains;
			} else {
				depModule._waitings.push(module);
			}
		}

		if (module._remains === 0) {
			emitload(module);
		}
	}

	// Define a module
	global.define = function(factory) {
		var uri = getCurrentScript();

		// Correct the uri of merged modules
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

	// An empty object to determine if a CMD loader exists
	global.define.cmd = {};

	gojs.cache = moduleMap;

	// Auto initialization
	var main = gojsNode.getAttribute('data-main');
	if (main) {
		gojs.init(main);
	}

})(this);