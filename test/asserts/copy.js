/* global QUnit,JSZip,JSZipTestUtils */
'use strict';

QUnit.module("copy");

var date = new Date("2020-07-05T15:03:26.000Z");

JSZipTestUtils.testZipFile("copy file", "ref/copy_file.zip", function (assert, expected) {
    var zip = new JSZip();
    zip.file("file1.txt", "This file should not be copied\n", {date: date});
    zip.file("file2.txt", "This file should not be copied\n", {date: date});
    zip.file("file3.txt", "This file should not be copied\n", {date: date});
    zip.file("copy.txt", "This file should be copied\n", {date: date});
    zip.copy("copy.txt", "copied.txt");
    var done = assert.async();
    zip.generateAsync({type: "binarystring"}).then(function (actual) {
        assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY), "Generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("copy folder", "ref/copy_folder.zip", function (assert, expected) {
    var zip = new JSZip();
    zip.file("file1.txt", "This file should not be copied\n", {date: date});
    zip.file("copy/file2.txt", "This file should not be copied\n", {date: date});
    zip.file("copy/file3.txt", "This file should not be copied\n", {date: date});
    zip.copy("copy/", "copied/");
    var done = assert.async();
    zip.generateAsync({type: "binarystring"}).then(function (actual) {
        assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY), "Generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("copy file to folder", "ref/copy_file_to_folder.zip", function (assert, expected) {
    var zip = new JSZip();
    zip.file("file1.txt", "This file should not be copied\n", {date: date});
    zip.file("file2.txt", "This file should not be copied\n", {date: date});
    zip.file("folder/file3.txt", "This file should not be copied\n", {date: date});
    zip.file("copy.txt", "This file should be copied\n", {date: date});
    zip.copy("copy.txt", "folder/copied.txt");
    var done = assert.async();
    zip.generateAsync({type: "binarystring"}).then(function (actual) {
        assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY), "Generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("copy folder to sub folder", "ref/copy_folder_to_sub_folder.zip", function (assert, expected) {
    var zip = new JSZip();
    zip.file("folder/file1.txt", "This file should be copied\n", {date: date});
    zip.file("folder/file2.txt", "This file should be copied\n", {date: date});
    zip.file("folder/file3.txt", "This file should be copied\n", {date: date});
    zip.copy("folder/", "newfolder/folder/");
    var done = assert.async();
    zip.generateAsync({type: "binarystring"}).then(function (actual) {
        assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY), "Generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});
