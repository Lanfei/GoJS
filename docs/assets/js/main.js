define(function(require) {

	var $ = require('./jquery');
	var marked = require('./marked');
	var prettify = require('./prettify');

	function updateView(id) {
		id = id || location.href.replace(/(?:.*(#\w+)|.*)/, '$1') || '#intro';
		$('.section').hide();
		$(id).show();
	}

	function initPage() {
		marked.setOptions({
			highlight: function(code) {
				return prettify.prettyPrintOne(escape(code));
			}
		});
		$('.section').each(function() {
			$(this).html(marked($(this).children('.markdown').val()));
		}).eq(0);
		updateView();
	}

	function initEvent() {
		if ('onhashchange' in window) {
			$(window).on({
				hashchange: function() {
					updateView();
				}
			});
			return;
		}
		$('body').on({
			click: function() {
				if (this.href.indexOf('#')) {
					updateView(this.href.replace(/(?:.*(#\w+)|.*)/, '$1'));
				}
			}
		}, 'a');
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