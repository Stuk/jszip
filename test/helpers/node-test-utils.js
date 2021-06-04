/* global QUnit,JSZip,JSZipTestUtils */
'use strict';

var fs = require("fs");
var path = require("path");

global.JSZip = require("../../lib/index");

global.JSZipTestUtils.loadZipFile = function(name, callback) {
    fs.readFile(path.join("test", name), "binary", callback);
};
process.on('uncaughtException', function(err) {
      console.log('uncaughtException: ' + err, err.stack);
      process.exit(1);
});

process.on('unhandledRejection', function(err) {
      console.log('unhandledRejection: ' + err, err.stack);
      process.exit(1);
});
