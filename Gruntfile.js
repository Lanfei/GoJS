module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json')
	});

	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', function() {

		grunt.initConfig({
			uglify: {
				default: {
					files: {
						'dist/go.js': 'src/go.js',
						'dist/go-css.js': 'src/go-css.js',
						'dist/go-json.js': 'src/go-json.js'
					}
				}
			},
			replace: {
				default: {
					src: ['dist/go.js'],
					dest: ['dist/go.js'],
					replacements: [{
						from: '@VERSION',
						to: grunt.config.get('pkg').version
					}]
				}
			}
		});

		grunt.task.run(['uglify', 'replace']);
	});
};
