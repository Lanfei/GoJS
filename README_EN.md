#GoJS

GoJS is a JavaScript module loader for web, which can organize your codes and modules in a elegant way. It solves the problem of module dependencies and naming conflicts, but also solves the difficulty in merging compaction beside the other similar frameworks, so you can make your coding more enjoyable.

##Usage

###1st Step, Initialize GoJS

```html
<!--
data-main: The entry module
-->
<script id="gojsnode" src="path/to/go.js" data-main="main"></script>
```

You can also [configure it](http://lanfei.github.io/GoJS/docs/index.html#config) before the initialization:

```html
<script src="path/to/go.js"></script>
<script>
gojs.config({
	// Some options
});
// Load main module
gojs.use('main');
</script>
```

###2nd Step, Write Modules Following [CMD Standard](https://github.com/cmdjs/specification/blob/master/draft/module.md)

```js
// main.js
define(function(require, exports, module){

	var foo = require('foo');
	foo.bar();

});
```

```js
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

>Finally, a tribute to <a target="_blank" href="http://requirejs.org">RequireJS</a> and <a target="_blank" href="http://seajs.org">Sea.js</a>, but also to pay tribute to all the people who work dedicated to open source.

——[Lanfei](http://www.clanfei.com/) on November 5, 2014
