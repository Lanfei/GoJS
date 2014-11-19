/**
 * GoJS 1.5.2
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

	// Current version of GoJS
	var gojs = global.gojs = {
		version: '1.5.2'
	};

	// Config Data of GoJS
	var config = {};

	/**
	 * Type
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
		if (path.indexOf('/') >= 0) {
			return path.match(/[^?#]*\//)[0];
		}
		return '';
	}

	// Return the absolute path of script element
	function absSrc(script) {
		return script.hasAttribute ? script.src : script.getAttribute('src', 4);
	}

	// Return the absolute uri based on referer
	function absUri(uri, referer) {
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
		else if (!/^(http:|https:|file:)?\/\//.test(uri)) {
			uri = normPath(config.base + uri);
		}
		return uri;
	}

	// Convert id to uri based on referer
	function id2Uri(id, referer) {
		var key, uri,
			alias = config.alias,
			paths = config.paths,
			vars = config.vars;

		// Parse alias
		uri = config.alias[id] || id;

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
		uri = absUri(uri, referer);

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

	// Convert uri to id according to `base` url
	function uri2Id(uri) {
		var id = uri.replace(config.base, '');
		if (id.slice(-3) === '.js') {
			id = id.substring(0, id.length - 3);
		}
		return id;
	}

	/**
	 * Module
	 */
	var mapCache = {},
		moduleCache = {},
		fetchedList = {};

	var STATUS = Module.STATUS = {
		// 1 - The `module.uri` is being fetched
		FETCHING: 1,
		// 2 - The meta data has been saved to cachedMods
		SAVED: 2,
		// 3 - The `module.dependencies` are being loaded
		LOADING: 3,
		// 4 - The module are ready to execute
		LOADED: 4,
		// 5 - The module is being executed
		EXECUTING: 5,
		// 6 - The `module.exports` is available
		EXECUTED: 6
	};

	// The constuctor
	function Module(uri) {
		// Meta data
		this.id = uri2Id(uri);
		this.uri = uri;
		this.exports = null;
		this.dependencies = [];

		this.status = 0;
		this.factory = null;
		this.callback = null;
		// Who depends on me
		this.waitings = [];
		// The number of unloaded dependencies
		this.remains = 0;
	}

	// Get an existed module or create a new one
	Module.get = function(uri) {
		return moduleCache[uri] || (moduleCache[uri] = new Module(uri));
	};

	// Load modules in async mode
	Module.use = function(ids, callback, referer) {
		if (isString(ids)) {
			ids = [ids];
		}

		// Save the meta data
		var module = new Module(referer);
		module.dependencies = ids || [];
		module.callback = callback || function() {};
		module.status = STATUS.SAVED;
		module.load();
	};

	// Save the meta data to the cache
	Module.save = function(uri, factory) {
		// Reduce the mapping uri
		var list = mapCache[uri];
		if (list) {
			var current = list.shift();
			if (list.length === 0) {
				delete mapCache[uri];
			}
			uri = current;
		}

		// Save the meta data
		var module = Module.get(uri);
		module.factory = factory;
		module.dependencies = module.resolve();
		module.status = STATUS.SAVED;
		module.load();
	};

	// Parse the mapping uri
	Module.parse = function(uri, referer) {
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

		// Update the map cache
		if (key) {
			key = id2Uri(key, referer);
			// If there is no cache, then save the map cache
			if (!mapCache[key]) {
				for (var j = idList.length - 1; j >= 0; --j) {
					uriList.unshift(id2Uri(idList[j], referer));
				}
				mapCache[key] = uriList;
			}
			return key;
		}
		return uri;
	};

	// Fetch module by uri
	Module.prototype.fetch = function() {
		// Prevent multiple fetching
		if (this.status >= STATUS.FETCHING || fetchedList[this.uri]) {
			return;
		}
		this.status = STATUS.FETCHING;
		fetchedList[this.uri] = true;

		// Load the module
		var module = this,
			uri = this.uri,
			loader = parseLoader(uri);
		loader.call(null, uri, function expose(exports) {
			// Save loader's exports
			if (exports) {
				module.exports = exports;
				module.onload();
			}
			// Modules not in CMD standard
			if (module.status <= STATUS.FETCHING) {
				module.onload();
			}
		});
	};

	// Parse the dependencies in factory
	Module.prototype.resolve = function() {
		if (!isFunction(this.factory)) {
			return [];
		}

		var re = /(?:[^\$\w\.])require\( *['"]([^'"]+)['"] *\)/g,
			code = this.factory.toString(),
			deps = [];

		code.replace(re, function(_, $1) {
			deps.push($1);
		});

		return deps;
	};

	// Load dependencies of the module
	Module.prototype.load = function() {

		var deps = this.dependencies,
			referer = this.uri;

		this.status = STATUS.LOADING;
		this.remains = deps.length;

		// check the status of dependencies
		for (var i = deps.length - 1; i >= 0; --i) {
			var uri = id2Uri(deps[i], referer);
			var module = Module.get(uri);

			if (module.status >= STATUS.LOADED) {
				--this.remains;
			} else {
				module.waitings.push(this);
				// Parse the mapping module
				var mappingUri = Module.parse(uri, referer);
				if (mappingUri !== uri) {
					// Do not save the mapping module to the cache
					module = new Module(mappingUri);
				}
				module.fetch();
			}
		}

		// If all the dependencies are loaded
		if (this.remains === 0) {
			this.onload();
		}
	};

	// When the module is loaded
	Module.prototype.onload = function() {

		this.status = STATUS.LOADED;

		// if there is a callback function
		if (this.callback) {
			var args = [],
				uri = this.uri,
				deps = this.dependencies;

			// Resolve arguments
			for (var i = deps.length - 1; i >= 0; --i) {
				var depUri = id2Uri(deps[i], uri);
				args.unshift(Module.get(depUri).exec());
			}

			this.callback.apply(null, args);
		} else {
			// Notify waiting modules
			var waitings = this.waitings;
			for (var j = waitings.length - 1; j >= 0; --j) {
				var module = waitings[j];
				if (--module.remains === 0) {
					module.onload();
				}
			}
		}

		// Reduce memory
		delete this.callback;
		delete this.waitings;
		delete this.remains;
	};

	Module.prototype.exec = function() {

		if (this.status >= STATUS.EXECUTING) {
			return this.exports;
		}
		this.status = STATUS.EXECUTING;

		// Create the require function
		var uri = this.uri;

		function require(id) {
			return Module.get(id2Uri(id, uri)).exec();
		}
		require.resolve = function(id) {
			return id2Uri(id, uri);
		};
		require.async = function(ids, callback) {
			Module.use(ids, callback, uri);
		};

		// Execute the factory
		var factory = this.factory;
		if (isFunction(factory)) {
			var exports = factory(require, this.exports = {}, this);
			this.exports = (exports !== undefined ? exports : this.exports);
		} else {
			this.exports = factory;
		}

		this.status = STATUS.EXECUTED;

		// Reduce memory
		delete this.factory;

		return this.exports;
	};

	// For Developers
	gojs.Module = Module;
	gojs.cache = moduleCache;

	/**
	 * Loader
	 */
	var currentFactorys = [],
		scripts = document.scripts,
		head = document.head || document.getElementsByTagName('head')[0];

	// Return the matching loader
	function parseLoader(uri) {
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

	// Create script element
	function JSLoader(uri, expose) {
		var charset = config.charset,
			node = document.createElement('script');
		node.src = uri;
		node.async = true;
		node.charset = isFunction(charset) ? charset(uri) : charset;
		node.onload = node.onerror = node.onreadystatechange = function() {
			if (!node.readyState || /loaded|complete/.test(node.readyState)) {
				// Save modules if currentScript is unable to get
				for (var i = 0, l = currentFactorys.length; i < l; ++i) {
					Module.save(uri, currentFactorys[i]);
				}
				currentFactorys = [];

				// Ensure only run once and handle memory leak in IE
				node.onload = node.onerror = node.onreadystatechange = null;
				if (!config.debug) {
					head.removeChild(node);
				}
				node = null;

				expose();
			}
		};
		head.insertBefore(node, head.firstChild);
	}

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

	// Define a module
	global.define = function(factory) {
		var currentScript = getCurrentScript();

		if (currentScript) {
			// Save the module
			Module.save(currentScript, factory);
		} else {
			// Save the module in script's onload event
			currentFactorys.push(factory);
		}
	};

	// An empty object to determine if a CMD loader exists
	global.define.cmd = {};

	// A public API to load modules
	gojs.use = function(ids, callback) {
		Module.use(config.preload, function() {
			Module.use(ids, callback, location.href);
		}, config.base);
	};

	/**
	 * Config
	 */
	var gojsNode = document.getElementById('gojsnode') || scripts[scripts.length - 1],
		gojsSrc = absSrc(gojsNode);

	config = {
		// A map used for simplify long module identifications
		alias: {},
		// A map used for simplify long paths
		paths: {},
		// In some scenarios, module path may be determined during run time, it can be configured by the vars option
		vars: {},
		// A map used for path conversions
		map: {},
		// For the expansion of other loaders
		loaders: {},
		// Pre-load plugins or modules
		preload: [],
		// Debug mode. The default value is false
		debug: false,
		// The root path used for all module lookups
		base: dirname(gojsSrc),
		// The charset of module files
		charset: 'utf-8'
	};

	// Configure
	gojs.config = function(options) {

		if (options === undefined) {
			return config;
		}

		// Remove empty preload items
		var preload = options.preload;
		if (preload) {
			for (var i = preload.length - 1; i >= 0; --i) {
				if (preload[i] === '') {
					preload.splice(i, 1);
				}
			}
		}

		// Normalize base option
		var base = absUri(options.base || dirname(gojsSrc), location.href);
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

	// Auto initialization
	var main = gojsNode.getAttribute('data-main');
	if (main) {
		gojs.use(main);
	}

})(this);
