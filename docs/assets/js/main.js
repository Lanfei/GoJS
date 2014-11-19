gojs.config({
	map: {
		'./marked-prettify': ['./marked', './prettify']
	}
});

define(function(require) {

	var $ = require('./jquery');
	var marked = require('./marked');
	var prettify = require('./prettify');

	function updateView(id) {
		id = id || location.href.replace(/(?:.*(#\w+)|.*)/, '$1') || '#intro';
		$('.section').hide();
		$(id).show();
		setTimeout(window.scrollTo, 0, 0, 0);
	}

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
		updateView();
	}

	function initEvent() {
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