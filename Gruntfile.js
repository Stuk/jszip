module.exports = function(grunt) {
  var browsers = [{
      browserName: "firefox",
      version: "19",
      platform: "XP"
  }, {
      browserName: "chrome",
      platform: "XP"
  }, {
      browserName: "chrome",
      platform: "linux"
  }, {
      browserName: "internet explorer",
      platform: "WIN8",
      version: "10"
  }, {
      browserName: "internet explorer",
      platform: "VISTA",
      version: "9"
  }, {
      browserName: "opera",
      platform: "Windows 2008",
      version: "12"
  }];

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
                  urls: ["http://127.0.0.1:9999/test/index.html"],
                  tunnelTimeout: 5,
                  build: process.env.TRAVIS_JOB_ID,
                  concurrency: 3,
                  browsers: browsers,
                  testname: "qunit tests",
                  tags: ["master"]
              }
          }
      }
  });

  // Loading dependencies
  // for (var key in grunt.file.readJSON("package.json").devDependencies) {
  //   if (key !== "grunt" && key.indexOf("grunt") === 0) grunt.loadNpmTasks(key);
  // }
  grunt.loadNpmTasks("grunt-saucelabs");
  grunt.loadNpmTasks("grunt-contrib-connect");

  grunt.registerTask("test", ["connect", "saucelabs-qunit"]);
};
