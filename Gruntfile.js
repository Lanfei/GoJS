module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			default: {
				options: {
					// sourceMap: true,
					banner: '/*! <%= pkg.name %> <%= pkg.version %> | <%= pkg.description %> */\n'
				},
				files: {
					'dist/go.js': 'src/go.js'
				}
			},
			plugins: {
				files: {
					'dist/go-css.js': 'src/go-css.js',
					'dist/go-json.js': 'src/go-json.js'
				}
			}
		},
		replace: {
			default: {
				overwrite: true,
				src: ['dist/go.js'],
				replacements: [{
					from: '@VERSION',
					to: '<%= pkg.version %>'
				}]
			}
		}
	});

	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['uglify', 'replace']);
};
