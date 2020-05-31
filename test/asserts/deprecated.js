/* global QUnit,JSZip,JSZipTestUtils */
'use strict';

QUnit.module("deprecated");

QUnit.test("Removed load method throws an exception", function(assert) {
    var file = JSZipTestUtils.createZipAll().file("Hello.txt");
    assert.throws(
        function() {
            new JSZip().load("");
        },
        /upgrade guide/,
        "load() throws an exception"
    );
});
QUnit.test("Removed constructor with data throws an exception", function(assert) {
    var file = JSZipTestUtils.createZipAll().file("Hello.txt");
    assert.throws(
        function() {
            var zip = new JSZip("");
        },
        /upgrade guide/,
        "new JSZip(data) throws an exception"
    );
});
QUnit.test("Removed asText method throws an exception", function(assert) {
    var file = JSZipTestUtils.createZipAll().file("Hello.txt");
    assert.throws(
        function() {
            file.asText();
        },
        /upgrade guide/,
        "file.asText() throws an exception"
    );
});
QUnit.test("Removed generate method throws an exception", function(assert) {
    var file = JSZipTestUtils.createZipAll().file("Hello.txt");
    assert.throws(
        function() {
            new JSZip().generate({type:"string"});
        },
        /upgrade guide/,
        "generate() throws an exception"
    );
});
