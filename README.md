#GoJS

GoJS 是一个适用于 Web 的 JavaScript 模块加载器，它可以帮助你更优雅地组织代码和模块。它解决了模块之间的依赖问题和命名冲突问题，同时也解决了同类框架中合并压缩成本高的问题，让你能够更加轻松愉快地享受编码的乐趣。[**README in English**](https://github.com/Lanfei/GoJS/blob/master/README_EN.md)

##如何使用

###第一步，初始化GoJS

```html
<!--
data-main: 入口模块
-->
<script id="gojsnode" src="path/to/go.js" data-main="main"></script>
```

或者 [进行配置](http://lanfei.github.io/GoJS/docs/index.html#config) 后再初始化入口模块：

```html
<script src="path/to/go.js"></script>
<script>
// 配置 GoJS
gojs.config({
	// 一些配置选项
});
// 加载入口模块
gojs.use('main');
</script>
```

###第二步，编写遵循 [CMD规范](http://lanfei.github.io/GoJS/docs/index.html#cmd) 的模块

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

	exports.bar = function(){
		// your codes
	}

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

> 最后，向 <a target="_blank" href="http://requirejs.org">RequireJS</a> 和 <a target="_blank" href="http://seajs.org">Sea.js</a> 致敬，也向所有投身于开源工作的自由人致敬。

—— <a target="_blank" href="http://www.clanfei.com/">张耕畅</a> 于2014年11月05日
