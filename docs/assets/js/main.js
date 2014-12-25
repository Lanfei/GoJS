define(function(require) {

	var $ = require('./jquery');
	var marked = require('./marked');
	var prettify = require('./prettify');

	var title = document.title;

	function initPage() {
		marked.setOptions({
			highlight: function(code) {
				return prettify.prettyPrintOne(escape(code));
			}
		});
		$('.section').each(function() {
			$(this).html(marked($(this).children('.markdown').val()));
		});
		$('.loading').remove();
		initShare();
		updateView();
	}

	function initEvent() {
		$(document).bind({
			WeixinJSBridgeReady: initShare
		});
		if ('onhashchange' in window) {
			$(window).on({
				hashchange: function() {
					updateView();
				}
			});
		} else {
			$('body').on({
				click: function() {
					if (this.href.indexOf('#') >= 0) {
						updateView(this.href.replace(/(?:.*(#\w+)|.*)/, '$1') || '#intro');
					}
				}
			}, 'a');
		}
		$('.footer .top').on({
			click: function() {
				window.scrollTo(0, 0);
			}
		});
	}

	function initShare() {
		if (!window.WeixinJSBridge) {
			return;
		}
		try {
			WeixinJSBridge.on('menu:share:appmessage', function(argv) {
				WeixinJSBridge.invoke('sendAppMessage', getShareData());
			});
			WeixinJSBridge.on('menu:share:timeline', function(argv) {
				WeixinJSBridge.invoke('shareTimeline', getShareData());
			});
		} catch (e) {}
	}

	function getShareData() {
		return {
			title: document.title,
			link: document.location.href,
			desc: $('#intro p').eq(0).text(),
			img_url: 'http://tp3.sinaimg.cn/1562087202/180/40038430931/1'
		};
	}

	function updateView(id) {
		id = id || location.href.replace(/(?:.*(#\w+)|.*)/, '$1') || '#intro';
		$('.section').hide();
		document.title = title + ' - ' + $(id).show().find('h2').eq(0).text();
		setTimeout(window.scrollTo, 0, 0, 0);
		ga('send', 'event', 'section', 'view', id);
	}

	function escape(code) {
		return code
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	initPage();
	initEvent();
});