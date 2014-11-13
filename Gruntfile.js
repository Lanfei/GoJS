module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json')
	});

	grunt.registerTask('default', function() {

		grunt.initConfig({
			uglify: {
				// options: {
				// 	mangle: false
				// },
				default: {
					files: {
						'dist/go.js': 'src/go.js',
						'dist/gojs-css.js': 'src/gojs-css.js',
						'dist/gojs-json.js': 'src/gojs-json.js'
					}
				}
			}
		});

		grunt.task.run(['uglify']);
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
};