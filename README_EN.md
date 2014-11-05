#GoJS

GoJS is a JavaScript module loader for web, which can organize your codes and modules in a elegant way. It solves module dependence problems and naming conflicts, so you can be more pleasure to enjoy the fun of coding.

##Usage

###1st Step, Initialize GoJS

```
<script src="path/to/go.js"></script>
<script>
gojs.config({
	// the base path of module files
	base: 'path/to/base/',
	// initialization module
	main: 'main',
	// a map to search the uri of merged modules
	map: {
		// for example, a.js and b.js were merged into a-b.min.js
		'a-b.min': ['a', 'b']
	},
	// pre-load files
	preload: [
		'http://code.jquery.com/jquery-2.1.1.min.js'
	],
	// if debug is true, GoJS will not use merged files
	debug: false,
	// the charset of module files
	charset: 'utf-8'
});

gojs.init();
</script>
```

you can also write in this way:

```
<script src="path/to/go.js" data-base="path/to/base" data-main="main"></script>
```

###2nd Step, Write Modules following [CMD Standard](https://github.com/cmdjs/specification/blob/master/draft/module.md)

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
