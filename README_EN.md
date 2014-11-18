#GoJS

GoJS is a JavaScript module loader for web, which can organize your codes and modules in a elegant way. It solves the problem of module dependencies and naming conflicts, but also solves the difficulty in merging compaction beside the other similar frameworks, so you can make your coding more enjoyable.

##Usage

###1st Step, Initialize GoJS

```
<!--
data-main: The entry module
-->
<script id="gojsnode" src="path/to/go.js" data-main="main"></script>
```

You can also use advanced configuration:

```
<script src="path/to/go.js"></script>
<script>
// Configure GoJS (the following parameters are optional)
gojs.config({
	// A map used for simplify long module identifications
	alias: {
		'jquery': 'http://example.com/path/to/lib/jquery-2.1.1.min.js'
	},
	// A map used for simplify long paths
	paths: {
		'deepdir': 'path/to/a/deep/dir'
	},
	// In some scenarios, module path may be determined during run time, it can be configured by the vars option
	vars: {
		'locale': document.location.hash || 'zh-cn'
	},
	// A map used for path conversions
	map: {
		// For example, foo.js and bar.js were merged into foo-bar.min.js
		'foo-bar.min': ['foo', 'bar']
	},
	// For the expansion of other loaders
	loaders: [
		txt: function(uri, expose){
			// ...
			// expose(exports);
		}
	],
	// Pre-load plugins or modules
	preload: [
		'jquery',
		'./gojs-json',
		'./i18n/{locale}'
	],
	// Debug mode
	debug: false,
	// The root path used for all module lookups
	base: 'path/to/base/',
	// The charset of module files
	charset: 'utf-8'
});

// Load main module
gojs.use('main');
</script>
```

###2nd Step, Write Modules Following [CMD Standard](https://github.com/cmdjs/specification/blob/master/draft/module.md)

```
// main.js
define(function(require, exports, module){

	var foo = require('foo');
	foo.bar();

});

// foo.js
define(function(require, exports, module){
	
	function bar(){
		// your codes
	}

	return {
		bar: bar
	};

});
```

###3st Step, Enjoy!

##Compatibility

GoJS compatible with all major browsers:

```
Chrome 3+
Firefox 2+
Safari 3.2+
Opera 9+
IE 5.5+
```

In theory, GoJS can be run in any browser.

##License

GoJS is available under the terms of the [MIT License](https://github.com/Lanfei/GoJS/blob/master/LICENSE), it free for anyone to use.

##What's More

>Finally, a tribute to [RequireJS](http://requirejs.org) and [Sea.js](http://seajs.org), but also to pay tribute to all the people who work dedicated to open source.

——[Lanfei](http://www.clanfei.com/) on November 5, 2014
