define(function(require, exports, module){
	module.exports = {
		name: 'D',
		sayHi: function(){
			debug('Yeah, I am C \'s friend, D.');
			require.async('./e', function(e){
				e.sayHi();
			})
		}
	};
});
