/* jshint qunit: true */
/* global JSZip,JSZipTestUtils */
'use strict';

var fs = require("fs");
var path = require("path");

global.JSZip = require("../../lib/index");

global.JSZipTestUtils.loadZipFile = function(name, callback) {
    fs.readFile(path.join("test", name), "binary", callback);
};
process.on('uncaughtException', function(err) {
      console.log('uncaughtException: ' + err, err.stack);
});



// Deprecated
// Extend assert methods to QUnit and Global scope through Backwards compatibility
(function() {
    function Assert( testContext ) {
        this.test = testContext;
    }
    Assert.prototype = QUnit.assert;
    var i,
    assertions = QUnit.assert;

    function applyCurrent( current ) {
        return function() {
            var assert = new Assert( QUnit.config.current );
            current.apply( assert, arguments );
        };
    }

    for ( i in assertions ) {
        if (!assertions.hasOwnProperty(i)) {
            continue;
        }
        QUnit[ i ] = applyCurrent( assertions[ i ] );
        global[ i ] = QUnit[ i ];
    }
})();
