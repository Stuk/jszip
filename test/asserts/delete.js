/* jshint qunit: true */
/* global JSZip,JSZipTestUtils */
'use strict';

QUnit.module("delete");

JSZipTestUtils.testZipFile("Delete file", "ref/text.zip", function(expected) {
    var zip = new JSZip();
    zip.file("Remove.txt", "This file should be deleted\n");
    zip.file("Hello.txt", "Hello World\n");
    zip.remove("Remove.txt");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function(actual) {
        ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("Delete file in folder", "ref/folder.zip", function(expected) {
    var zip = new JSZip();
    zip.folder("folder").file("Remove.txt", "This folder and file should be deleted\n");
    zip.remove("folder/Remove.txt");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function(actual) {
        ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("Delete file in folder, with a relative path", "ref/folder.zip", function(expected) {
    var zip = new JSZip();
    var folder = zip.folder("folder");
    folder.file("Remove.txt", "This folder and file should be deleted\n");
    folder.remove("Remove.txt");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function(actual) {
        ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("Delete folder", "ref/text.zip", function(expected) {
    var zip = new JSZip();
    zip.folder("remove").file("Remove.txt", "This folder and file should be deleted\n");
    zip.file("Hello.txt", "Hello World\n");
    zip.remove("remove");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function(actual) {
        ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("Delete folder with a final /", "ref/text.zip", function(expected) {
    var zip = new JSZip();
    zip.folder("remove").file("Remove.txt", "This folder and file should be deleted\n");
    zip.file("Hello.txt", "Hello World\n");
    zip.remove("remove/");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function(actual) {
        ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("Delete unknown path", "ref/text.zip", function(expected) {
    var zip = new JSZip();
    zip.file("Hello.txt", "Hello World\n");
    zip.remove("unknown_file");
    zip.remove("unknown_folder/Hello.txt");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function(actual) {
        ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("Delete nested folders", "ref/text.zip", function(expected) {
    var zip = new JSZip();
    zip.folder("remove").file("Remove.txt", "This folder and file should be deleted\n");
    zip.folder("remove/second").file("Sub.txt", "This should be removed");
    zip.file("remove/second/another.txt", "Another file");
    zip.file("Hello.txt", "Hello World\n");
    zip.remove("remove");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function(actual) {
        ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("Delete nested folders from relative path", "ref/folder.zip", function(expected) {
    var zip = new JSZip();
    zip.folder("folder");
    zip.folder("folder/1/2/3");
    zip.folder("folder").remove("1");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function(actual) {
        ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        JSZipTestUtils.checkGenerateStability(actual);
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

