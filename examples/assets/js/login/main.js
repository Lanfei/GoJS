define(function(require){

	var signin = document.getElementById('signin');

	signin.onclick = function(){
		require.async('./login', function(login){
			login.show();
		});
	};

});
