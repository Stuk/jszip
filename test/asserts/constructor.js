/* global QUnit,JSZip,JSZipTestUtils */
'use strict';

QUnit.module("constructor");

QUnit.test("JSZip exists", function(assert){
    assert.ok(JSZip, "JSZip exists");
});

QUnit.test("new JSZip()", function(assert){
    var zip = new JSZip();
    assert.ok(zip instanceof JSZip, "Constructor works");
});

QUnit.test("JSZip()", function(assert){
    var zip = JSZip(); // jshint ignore:line
    assert.ok(zip instanceof JSZip, "Constructor adds `new` before itself where necessary");
});

