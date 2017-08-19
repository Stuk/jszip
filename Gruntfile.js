/*jshint node: true */
'use strict';
module.exports = function(grunt) {
  // see https://saucelabs.com/rest/v1/info/browsers/webdriver
  var browsers = [{
      browserName: "iphone",
      version: "7.0"
  }, {
      browserName: "iphone",
      version: "9.2"
  }, {
      browserName: "android",
      platform: "Linux",
      version: "4.0"
  }, {
      browserName: "android",
      platform: "Linux",
      version: "4.4"
  }, {
      browserName: "android",
      platform: "Linux",
      version: "5.1"
  }, {
      browserName: "firefox",
      platform: "Windows 10"
  }, {
      browserName: "chrome",
      platform: "Windows 10"
  }, {
      browserName: "internet explorer",
      platform: "XP",
      version: "6"
  }, {
      browserName: "internet explorer",
      platform: "XP",
      version: "7"
  }, {
      browserName: "internet explorer",
      platform: "Windows 7",
      version: "8"
  }, {
      browserName: "internet explorer",
      platform: "Windows 7",
      version: "9"
  }, {
      browserName: "internet explorer",
      platform: "Windows 8",
      version: "10"
  }, {
      browserName: "internet explorer",
      platform: "Windows 10",
      version: "11"
  }, {
      browserName: "MicrosoftEdge",
      platform: "Windows 10",
      version: "13"
  }, {
      browserName: "opera",
      platform: "Windows 2008",
      version: "12"
  }, {
      browserName: "safari",
      platform: "OS X 10.8",
      version: "6"
  }, {
      browserName: "safari",
      platform: "OS X 10.9",
      version: "7"
  }, {
      browserName: "safari",
      platform: "OS X 10.10",
      version: "8"
  }, {
      browserName: "safari",
      platform: "OS X 10.11",
      version: "9"
  }];

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
                  port: 9999
              }
          }
      },
      'saucelabs-qunit': {
          all: {
              options: {
                  urls: ["http://127.0.0.1:9999/test/index.html?hidepassed"],
                  build: process.env.TRAVIS_JOB_ID,
                  throttled: 3,
                  "max-duration" : 600, // seconds, IE6 is slow
                  browsers: browsers,
                  testname: "qunit tests",
                  tags: tags
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
          banner : grunt.file.read('lib/license_header.js').replace(/__VERSION__/, version)
        }
      }
    },
    uglify: {
      options: {
        mangle: true,
        preserveComments: false,
        banner : grunt.file.read('lib/license_header.js').replace(/__VERSION__/, version)
      },
      all: {
        src: 'dist/jszip.js',
        dest: 'dist/jszip.min.js'
      }
    },
    qunit: {
        all: ['test/**/*.html']
    }
  });

  grunt.loadNpmTasks("grunt-saucelabs");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');

  if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
    grunt.registerTask("test", ["qunit", "connect", "saucelabs-qunit"]);
  } else {
    grunt.registerTask("test", ["qunit"]);
  }
  grunt.registerTask("build", ["browserify", "uglify"]);
  grunt.registerTask("default", ["jshint", "build"]);
};
