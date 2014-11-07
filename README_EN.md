#GoJS

GoJS is a JavaScript module loader for web, which can organize your codes and modules in a elegant way. It solves the problem of module dependencies and naming conflicts, but also solves the difficulty in merging compaction beside similar frameworks, so you can make your coding more enjoyable.

##Usage

###1st Step, Initialize GoJS

```
<!--
data-base: The root path used for all module lookups
data-main: The entry module
-->
<script src="path/to/go.js" data-base="path/to/base/" data-main="main"></script>
```

You can also use advanced configuration:

```
<script src="path/to/go.js"></script>
<script>
// GoJS config
gojs.config({
	// The root path used for all module lookups
	base: 'path/to/base/',
	// A map used for path conversions
	map: {
		// For example, a.js and b.js were merged into a-b.min.js
		'a-b.min': ['a', 'b']
	},
	// A map used for simplify long module identifications
	alias: {
		'jquery': 'http://code.jquery.com/jquery-2.1.1.min.js'
	},
	// A map used for simplify long paths
	paths: {
		'path': 'this/is/a/long/path'
	},
	// In some scenarios, module path may be determined during run time, it can be configured by the vars option
	vars: {
		'locale': document.location.hash || 'zh-cn'
	},
	// Pre-load files
	preload: [
		'jquery',
		'./i18n/{locale}'
	],
	// If debug is true, GoJS will not use the map option
	debug: false,
	// The charset of module files
	charset: 'utf-8'
});

// Load main module
gojs.init('main');
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

>Finally, a tribute to RequireJS and SeaJS, but also to pay tribute to all the people who work dedicated to open source.

——[Lanfei](http://www.clanfei.com/) on November 5, 2014
