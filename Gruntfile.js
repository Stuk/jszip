/*jshint node: true */
"use strict";

module.exports = function(grunt) {
  var version = require("./package.json").version;

  grunt.initConfig({
    jshint: {
      // see https://github.com/gruntjs/grunt-contrib-jshint/issues/198
      // we can't override the options using the jshintrc path
      options: grunt.file.readJSON('.jshintrc'),
      production: ['./lib/**/*.js'],
      test: ['./test/helpers/**/*.js', './test/asserts/**/*.js'],
      documentation: {
        options: {
          // we include js files with jekyll, jshint can't see all
          // variables and we can't declare all of them
          undef: false,
          // 'implied' still give false positives in our case
          strict: false
        },
        files: {
          src: ['./documentation/**/*.js']
        }
      }
    },
    browserify: {
      all: {
        files: {
          'dist/jszip.js': ['lib/index.js']
        },
        options: {
          browserifyOptions: {
            standalone: 'JSZip',
            transform: ['package-json-versionify'],
            insertGlobalVars: {
              process: undefined,
              Buffer: undefined,
              __filename: undefined,
              __dirname: undefined
            },
            builtins: false
          },
          banner: grunt.file.read('lib/license_header.js').replace(/__VERSION__/, version)
        }
      }
    },
    uglify: {
      options: {
        mangle: true,
        preserveComments: false,
        banner: grunt.file.read('lib/license_header.js').replace(/__VERSION__/, version)
      },
      all: {
        src: 'dist/jszip.js',
        dest: 'dist/jszip.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask("build", ["browserify", "uglify"]);
  grunt.registerTask("default", ["jshint", "build"]);
};
