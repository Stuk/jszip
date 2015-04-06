/* jshint qunit: true */
/* global JSZip,JSZipTestUtils */
'use strict';

QUnit.module("constructor");

test("JSZip exists", function(assert){
    assert.ok(JSZip, "JSZip exists");
});

test("new JSZip()", function(assert){
    var zip = new JSZip();
    assert.ok(zip instanceof JSZip, "Constructor works");
});

test("JSZip()", function(assert){
    var zip = JSZip(); // jshint ignore:line
    assert.ok(zip instanceof JSZip, "Constructor adds `new` before itself where necessary");
});

