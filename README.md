#GoJS

GoJS是一个适用于Web的JavaScript模块加载器，它可以帮助你更优雅地组织代码和模块。它解决了模块之间的依赖问题和命名冲突问题，让你能够更加轻松愉快地享受编码的乐趣。[README in English](https://github.com/Lanfei/GoJS/blob/master/README_EN.md)

##如何使用

###第一步，初始化GoJS

```
<script src="path/to/go.js"></script>
<script>
gojs.config({
	// 模块文件的基础路径
	base: 'path/to/base/',
	// 入口模块
	main: 'main',
	// 映射表，用于查找合并模块的真实路径
	map: {
		// 如a.js与b.js合并压缩为a-b.min.js
		'a-b.min': ['a', 'b']
	},
	// 预加载的文件或模块
	preload: [
		'http://code.jquery.com/jquery-2.1.1.min.js'
	],
	// 是否为调试模式，调试模式将不使用合并模块文件
	debug: false,
	// 模块的编码
	charset: 'utf-8'
});

gojs.init();
</script>
```

或者

```
<script src="path/to/go.js" data-base="path/to/base" data-main="main"></script>
```

###第二步，编写符合[CMD规范](https://github.com/seajs/seajs/issues/242)的模块

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

>Chrome 3+
>Firefox 2+
>Safari 3.2+
>Opera 9+
>IE 5.5+

理论上，GoJS可以运行在任何浏览器环境上。

##开源许可

GoJS遵循 [MIT 协议](https://github.com/Lanfei/GoJS/blob/master/LICENSE)，无论个人还是公司，都可以免费自由地使用。

##说点什么

>最后，向RequireJS和SeaJS致敬，也向所有致力于开源工作的自由人致敬。

——[张耕畅](http://www.clanfei.com/)于2014年11月05日
