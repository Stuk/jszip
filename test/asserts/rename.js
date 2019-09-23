/* global QUnit,JSZip,JSZipTestUtils */
'use strict';

QUnit.module("rename");

JSZipTestUtils.testZipFile("rename file", "ref/rename_file.zip", function (assert, expected) {
    var zip = new JSZip();
    zip.file("file1.txt", "This file should not be renamed\n");
    zip.file("file2.txt", "This file should not be renamed\n");
    zip.file("file3.txt", "This file should not be renamed\n");
    zip.file("rename.txt", "This file should be renamed\n");
    zip.rename("rename.txt", "renamed.txt");
    var done = assert.async();
    zip.generateAsync({type: "binarystring"}).then(function (actual) {
        assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY), "Generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("rename folder", "ref/rename_folder.zip", function (assert, expected) {
    var zip = new JSZip();
    zip.file("file1.txt", "This file should not be renamed\n");
    zip.file("rename/file2.txt", "This file should not be renamed\n");
    zip.file("rename/file3.txt", "This file should not be renamed\n");
    zip.rename("rename/", "renamed/");
    var done = assert.async();
    zip.generateAsync({type: "binarystring"}).then(function (actual) {
        assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY), "Generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("rename file to folder", "ref/rename_file_to_folder.zip", function (assert, expected) {
    var zip = new JSZip();
    zip.file("file1.txt", "This file should not be renamed\n");
    zip.file("file2.txt", "This file should not be renamed\n");
    zip.file("folder/file3.txt", "This file should not be renamed\n");
    zip.file("rename.txt", "This file should be renamed\n");
    zip.rename("rename.txt", "folder/renamed.txt");
    var done = assert.async();
    zip.generateAsync({type: "binarystring"}).then(function (actual) {
        assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY), "Generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("rename folder to sub folder", "ref/rename_folder_to_sub_folder.zip", function (assert, expected) {
    var zip = new JSZip();
    zip.file("folder/file1.txt", "This file should be renamed\n");
    zip.file("folder/file2.txt", "This file should be renamed\n");
    zip.file("folder/file3.txt", "This file should be renamed\n");
    zip.rename("folder/", "newfolder/folder/");
    var done = assert.async();
    zip.generateAsync({type: "binarystring"}).then(function (actual) {
        assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY), "Generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});
