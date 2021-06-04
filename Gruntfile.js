/*jshint node: true */
"use strict";

module.exports = function(grunt) {
  // https://wiki.saucelabs.com/display/DOCS/Platform+Configurator
  // A lot of the browsers seem to time out with Saucelab's unit testing
  // framework. Here are the browsers that work and get enough coverage for our
  // needs.
  var browsers = [
    {browserName: "chrome"},
    {browserName: "firefox", platform: "Linux"},
    {browserName: "internet explorer"}
  ];

  var tags = [];
  if (process.env.TRAVIS_PULL_REQUEST && process.env.TRAVIS_PULL_REQUEST != "false") {
    tags.push("pr" + process.env.TRAVIS_PULL_REQUEST);
  } else if (process.env.TRAVIS_BRANCH) {
    tags.push(process.env.TRAVIS_BRANCH);
  }

  var version = require("./package.json").version;

  grunt.initConfig({
    connect: {
      server: {
        options: {
          base: "",
          port: 8080
        }
      }
    },
    'saucelabs-qunit': {
      all: {
        options: {
          urls: ["http://127.0.0.1:8080/test/index.html?hidepassed"],
          build: process.env.TRAVIS_JOB_ID,
          throttled: 4,
          "max-duration": 1200, // seconds, IE6 is slow
          browsers: browsers,
          testname: "qunit tests",
          tags: tags,
          // Tests have statusCheckAttempts * pollInterval seconds to complete
          pollInterval: 2000,
          statusCheckAttempts: 240,
          "max-duration": 1200,
          browsers: browsers,
          maxRetries: 2
        }
      }
    },
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

  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-saucelabs");
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // A task to cause Grunt to sit and wait, keeping the test server running
  grunt.registerTask("wait", function() {
    this.async();
  });

  grunt.registerTask("test-local", ["build", "connect", "wait"]);
  grunt.registerTask("test-remote", ["build", "connect", "saucelabs-qunit"]);

  if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
    grunt.registerTask("test", ["jshint", "test-remote"]);
  } else {
    grunt.registerTask("test", ["jshint", "test-local"]);
  }
  grunt.registerTask("build", ["browserify", "uglify"]);
  grunt.registerTask("default", ["jshint", "build"]);
};
