/**
 * GoJS 1.4.0
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
		version: '1.4.0'
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
	 * Lang
	 */

	function isType(type) {
		return function(obj) {
			return {}.toString.call(obj) === '[object ' + type + ']';
		};
	}

	var isObject = isType('Object');
	var isString = isType('String');
	var isFunction = isType('Function');
	var isArray = Array.isArray || isType('Array');

	/**
	 * Config
	 */
	var PROTOCOL_RE = /^(http:|https:|file:)?\/\//;

	var scripts = document.scripts,
		gojsNode = document.getElementById('gojsnode') || scripts[scripts.length - 1],
		gojsSrc = absSrc(gojsNode),
		config = {
			map: {},
			vars: {},
			alias: {},
			paths: {},
			loaders: {},
			preload: [],
			debug: false,
			base: dirname(gojsSrc),
			charset: 'utf-8'
		};

	// Return the absolute uri according to referer parameter
	function resolveUri(uri, referer) {
		// Relative
		if (referer && uri.indexOf('.') === 0) {
			uri = normPath(dirname(referer) + uri);
		}
		// Default protocol
		else if (uri.indexOf('//') === 0) {
			uri = location.protocol + uri;
		}
		// Root
		else if (uri.indexOf('/') === 0) {
			uri = location.href.replace(/^(.*?\/\/.*?)\/.*/, '$1') + uri;
		}
		// Top-level
		else if (!PROTOCOL_RE.test(uri)) {
			uri = normPath(config.base + uri);
		}
		return uri;
	}

	// Config function
	gojs.config = function(options) {

		if (options === undefined) {
			return config;
		}

		// Remove empty preload items
		var preload = options.preload;
		for (var i = preload.length - 1; i >= 0; --i) {
			if (preload[i] === '') {
				preload.splice(i, 1);
			}
		}

		// Normalize base option
		var base = resolveUri(options.base || dirname(gojsSrc), location.href);
		if (base.slice(-1) !== '/') {
			base += '/';
		}
		options.base = base;

		// Merge and save config
		for (var key in options) {
			var curr = options[key];
			var prev = config[key];

			if (curr) {
				if (isArray(curr)) {
					curr = prev.concat(curr);
				} else if (isObject(curr)) {
					for (var k in prev) {
						if (curr[k] === undefined) {
							curr[k] = prev[k];
						}
					}
				}
			}

			config[key] = curr;
		}
	};

	/**
	 * Loader
	 */
	var moduleMap = {},
		loadedMap = {},
		mapCache = {},
		currentFactorys = [],
		head = document.head || document.getElementsByTagName('head')[0];

	// Return the url of the current script
	function getCurrentScript() {

		// Chrome
		if (document.currentScript) {
			return absSrc(document.currentScript);
		}

		// IE 6-9
		for (var i = 0, l = scripts.length; i < l; ++i) {
			var script = scripts[i];
			if (script.readyState === 'interactive') {
				return absSrc(script);
			}
		}
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

		// Get the absolute uri
		uri = resolveUri(uri, referer);

		// If the uri ends with `#`, just return it without `#`
		if (uri.slice(-1) === '#') {
			uri = uri.substring(0, uri.length - 1);
		}
		// Add `.js` extension
		else if (uri.indexOf('?') < 0 && !/(\.js(on)?|\.css|\/)$/.test(uri)) {
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

	// Return a module according to uri parameter
	function getModuleByUri(uri) {
		// If the module is not exists, initialize it
		moduleMap[uri] = moduleMap[uri] || {
			id: uri2Id(uri),
			uri: uri,
			factory: null,
			exports: null,
			dependencies: [],
			// Who depends on me
			_waitings: [],
			// The number of unloaded dependencies
			_remains: 0
		};
		return moduleMap[uri];
	}

	// Return the matching loader
	function getLoaderByUri(uri) {
		var re,
			loader = JSLoader,
			loaders = config.loaders;
		for (var key in loaders) {
			re = new RegExp('\\.' + key + '(\\?|$)');
			if (re.test(uri)) {
				loader = loaders[key];
				break;
			}
		}
		return loader;
	}

	// Load module by uri
	function loadModule(uri) {
		// Prevent multiple loading
		if (loadedMap[uri]) {
			return;
		}
		loadedMap[uri] = true;

		// begin to load the module
		var module = getModuleByUri(uri),
			loader = getLoaderByUri(uri);
		loader.call(null, uri, function(exports) {
			// Save loader's exports
			if (exports) {
				module.exports = exports;
			}
			// Modules not in CMD standard
			if (module._waitings && module.exports === null) {
				emitLoad(module);
			}
		});

		return module;
	}

	// Create script element
	function JSLoader(uri, callback) {
		var charset = config.charset,
			node = document.createElement('script');
		node.src = uri;
		node.async = true;
		node.charset = isFunction(charset) ? charset(uri) : charset;
		node.onload = node.onerror = node.onreadystatechange = function() {
			if (!node.readyState || /loaded|complete/.test(node.readyState)) {
				// Save modules if currentScript is unable to get
				for (var i = 0, l = currentFactorys.length; i < l; ++i) {
					saveModule(uri, currentFactorys[i]);
				}
				currentFactorys = [];

				// Ensure only run once and handle memory leak in IE
				node.onload = node.onerror = node.onreadystatechange = null;
				if (!config.debug) {
					head.removeChild(node);
				}
				node = null;

				callback();
			}
		};
		head.insertBefore(node, head.firstChild);
	}

	// Call this function when module is loaded
	function emitLoad(module) {
		var factory = module.factory,
			waitings = module._waitings;

		// Save exports if factory is a function
		if (typeof factory === 'function') {
			var require = requireFactory(module.uri);
			var exports = factory(require, module.exports, module);
			module.exports = exports || module.exports;
		}

		// Notify waiting modules or callbacks
		for (var i = waitings.length - 1; i >= 0; --i) {
			var waiting = waitings[i];
			if (--waiting._remains === 0) {
				if (typeof waiting === 'function') {
					emitCallback(waiting);
				} else {
					emitLoad(waiting);
				}
			}
		}

		// Reduce memory
		delete module._waitings;
		delete module._remains;
	}

	// Call this function when callback's dependencies are loaded
	function emitCallback(callback) {
		var args = [],
			uri = callback.uri,
			deps = callback.dependencies;

		// Resolve arguments
		for (var i = deps.length - 1; i >= 0; --i) {
			var depUri = id2Uri(deps[i], uri);
			args.unshift(getModuleByUri(depUri).exports);
		}

		callback.apply(null, args);

		// Reduce memory
		delete callback._remains;
	}

	// Parse the mapping uri
	function parseMap(uri, referer) {
		var map = config.map,
			idList, uriList = [];

		// Check if the id matching in the map
		for (var key in map) outer: {
			idList = map[key];
			for (var i = idList.length - 1; i >= 0; --i) {
				if (id2Uri(idList[i], referer) === uri) {
					break outer;
				}
			}
			key = null;
		}

		// Save the map cache
		if (key) {
			key = id2Uri(key, referer);
			for (var j = idList.length - 1; j >= 0; --j) {
				uriList.unshift(id2Uri(idList[j], referer));
			}
			mapCache[key] = uriList;
			return key;
		}
		return uri;
	}

	// Resolve dependencies
	function resolveDeps(waiting) {
		var deps = waiting.dependencies,
			uri = waiting.uri;

		waiting._remains = deps.length;

		// check if the dependence is loaded
		for (var i = deps.length - 1; i >= 0; --i) {
			var depUri = id2Uri(deps[i], uri);
			var depModule = getModuleByUri(depUri);
			loadModule(parseMap(depUri, uri));

			if (depModule._remains === undefined) {
				--waiting._remains;
			} else {
				depModule._waitings.push(waiting);
			}
		}

		// If all the dependencies are loaded
		if (waiting._remains === 0) {
			if (isFunction(waiting)) {
				emitCallback(waiting);
			} else {
				emitLoad(waiting);
			}
		}
	}

	// Load module in async mode
	function async(ids, callback, referer) {

		if (isString(ids)) {
			ids = [ids];
		}

		callback.dependencies = ids;
		callback.uri = referer;

		resolveDeps(callback);
	}

	// A factory to create require function
	function requireFactory(uri) {

		// The require function
		function require(id) {
			return getModuleByUri(id2Uri(id, uri)).exports;
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

	// Save a module
	function saveModule(uri, factory) {

		// Reduce the mapping uri
		var index,
			list = mapCache[uri];
		if (list) {
			index = list.index || 0;
			uri = list[index];
			list.index = index + 1;
		}

		// Save the module
		var module = getModuleByUri(uri);
		module.factory = factory;

		if (typeof factory === 'function') {
			module.exports = {};
			module.dependencies = parseDeps(factory);
		} else {
			module.exports = factory;
		}

		resolveDeps(module);
	}

	// Define a module
	global.define = function(factory) {
		var currentScript = getCurrentScript();

		if (currentScript) {
			// Save the module if currentScript is able to get
			saveModule(currentScript, factory);
		} else {
			// Save the module in script's onload event
			currentFactorys.push(factory);
		}
	};

	// An empty object to determine if a CMD loader exists
	global.define.cmd = {};

	// A Public API to load modules
	gojs.use = function(ids, callback) {
		async(config.preload, function() {
			async(ids, callback || function() {}, location.href);
		});
	};

	// For developer
	gojs.cache = moduleMap;

	// Auto initialization
	var main = gojsNode.getAttribute('data-main');
	if (main) {
		gojs.use(main);
	}

})(this);