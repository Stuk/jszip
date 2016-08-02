/* jshint qunit: true */
/* global JSZip,JSZipTestUtils */
'use strict';

QUnit.module("version");

test("JSZip.version is correct", function(assert){
    assert.ok(JSZip.version, "JSZip.version exists");
    assert.ok(JSZip.version.match(/^\d+\.\d+\.\d+/), "JSZip.version looks like a correct version");
});
