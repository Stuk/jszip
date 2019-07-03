/* global QUnit,JSZip,JSZipTestUtils */
'use strict';

QUnit.module("filter");

QUnit.test("Filtering a zip", function(assert) {
    var zip = new JSZip();
    zip.file("1.txt", "1\n");
    zip.file("2.txt", "2\n");
    zip.file("3.log", "3\n");
    var result = zip.filter(function(relativeFilename, file) {
        return relativeFilename.indexOf(".txt") !== -1;
    });
    assert.equal(result.length, 2, "filter has filtered");
    assert.ok(result[0].name.indexOf(".txt") !== -1, "filter has filtered the good file");
    assert.ok(result[1].name.indexOf(".txt") !== -1, "filter has filtered the good file");
});

QUnit.test("Filtering a zip from a relative path", function(assert) {
    var zip = new JSZip();
    zip.file("foo/1.txt", "1\n");
    zip.file("foo/2.txt", "2\n");
    zip.file("foo/3.log", "3\n");
    zip.file("1.txt", "1\n");
    zip.file("2.txt", "2\n");
    zip.file("3.log", "3\n");

    var count = 0;
    var result = zip.folder("foo").filter(function(relativeFilename, file) {
        count++;
        return relativeFilename.indexOf("3") !== -1;
    });
    assert.equal(count, 3, "the callback has been called the right number of times");
    assert.equal(result.length, 1, "filter has filtered");
    assert.equal(result[0].name, "foo/3.log", "filter has filtered the good file");
});

QUnit.test("Filtering a zip : the full path is still accessible", function(assert) {
    var zip = new JSZip();
    zip.file("foo/1.txt", "1\n");
    zip.file("foo/2.txt", "2\n");
    zip.file("foo/3.log", "3\n");
    zip.file("1.txt", "1\n");
    zip.file("2.txt", "2\n");
    zip.file("3.log", "3\n");

    var result = zip.folder("foo").filter(function(relativeFilename, file) {
        return file.name.indexOf("3") !== -1;
    });
    assert.equal(result.length, 1, "the filter only match files/folders in the current folder");
    assert.equal(result[0].name, "foo/3.log", "filter has filtered the good file");
});
