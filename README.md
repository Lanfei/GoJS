#GoJS

GoJS是一个适用于Web的JavaScript模块加载器，它可以帮助你更优雅地组织代码和模块。它解决了模块之间的依赖问题和命名冲突问题，同时也解决了同类框架中合并压缩成本高的问题，让你能够更加轻松愉快地享受编码的乐趣。[**README in English**](https://github.com/Lanfei/GoJS/blob/master/README_EN.md)

##如何使用

###第一步，初始化GoJS

```
<!--
data-base: 模块文件的基础路径
data-main: 入口模块
-->
<script id="gojsnode" src="path/to/go.js" data-base="path/to/base/" data-main="main"></script>
```

或者使用更高级的配置方式：

```
<script src="path/to/go.js"></script>
<script>
// 配置GoJS
gojs.config({
	// 模块文件的基础路径
	base: 'path/to/base/',
	// 模块路径映射表，用于调试或压缩合并的路径转换
	map: {
		// 如a.js与b.js合并压缩为a-b.min.js
		'a-b.min': ['a', 'b']
	},
	// 用于简化较长的模块标识
	alias: {
		'jquery': 'http://code.jquery.com/jquery-2.1.1.min.js'
	},
	// 用于简化较长的模块目录
	paths: {
		'path': 'this/is/a/long/path'
	},
	// 某些场景下，模块路径在运行时才能确定，这时可以通过 vars 选项来配置
	vars: {
		'locale': document.location.hash || 'zh-cn'
	},
	// 需要预加载的插件或模块
	preload: [
		'jquery',
		'./gojs-json',
		'./i18n/{locale}'
	],
	// 是否为调试模式，调试模式将不使用合并模块文件
	debug: false,
	// 模块文件的编码
	charset: 'utf-8'
});

// 加载入口模块
gojs.init('main');
</script>
```

###第二步，编写遵循[CMD规范](https://github.com/seajs/seajs/issues/242)的模块

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

###第三步，享受编码的乐趣吧！

##兼容性

GoJS兼容所有主流浏览器：

```
Chrome 3+
Firefox 2+
Safari 3.2+
Opera 9+
IE 5.5+
```

理论上，GoJS可以运行在任何浏览器环境上。

##开源许可

GoJS遵循 [MIT 协议](https://github.com/Lanfei/GoJS/blob/master/LICENSE)，无论个人还是公司，都可以免费自由地使用。

##说点什么

>最后，向RequireJS和SeaJS致敬，也向所有致力于开源工作的自由人致敬。

——[张耕畅](http://www.clanfei.com/)于2014年11月05日
