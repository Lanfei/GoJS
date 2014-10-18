define(function(require, exports, module){
	module.exports = {
		name: 'D',
		sayHi: function(){
			require.async('c', function(c){
				debug('Yeah, I am ' + c.name + '\'s friend, D.');
			});
			require.async('e', function(e){
				e.sayHi();
			});
		}
	};
});