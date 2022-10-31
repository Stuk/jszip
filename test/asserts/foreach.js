"use strict";

QUnit.module("forEach");

QUnit.test("forEach works on /", function (assert) {
    var zip = JSZipTestUtils.createZipAll();
    var count = 0;
    var calls = [];

    assert.equal(zip.root, "");

    zip.forEach(function (path, elt) {
        assert.equal(path, elt.name, "the full path is given on / for " + elt.name);
        count++;
        calls.push(path);
    });

    assert.equal(count, 3, "the callback has been called the right number of times");
    assert.deepEqual(calls, ["Hello.txt", "images/", "images/smile.gif"], "all paths have been called");
});

QUnit.test("forEach works on a sub folder", function (assert) {
    var zip = new JSZip();
    var sub = zip.folder("subfolder");
    sub.file("Hello.txt", "Hello World\n");
    sub.folder("images").file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
    var count = 0;
    var calls = [];

    assert.ok(zip.file("subfolder/Hello.txt"));
    assert.equal(sub.root, "subfolder/");

    sub.forEach(function (path, elt) {
        assert.equal(path, elt.name.substr("subfolder/".length), "the full path is given on subfolder/ for " + path);
        count++;
        calls.push(path);
    });

    assert.equal(count, 3, "the callback has been called the right number of times");
    assert.deepEqual(calls, ["Hello.txt", "images/", "images/smile.gif"], "all paths have been called");
});
