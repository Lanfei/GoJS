module.exports = function(grunt) {

	grunt.file.setBase('../../../..');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json')
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.file.setBase('./docs/assets/js/merge');

	grunt.registerTask('default', function() {

		grunt.initConfig({
			uglify: {
				options: {
					mangle: {
						except: ['require']
					}
				},
				default: {
					files: {
						'foo-bar.min.js': ['foo.js', 'bar.js']
					}
				}
			}
		});

		grunt.task.run(['uglify']);
	});
};