/* jshint qunit: true */
/* global JSZip,JSZipTestUtils */
'use strict';

QUnit.module("unicode");

// zip -X -0 utf8.zip amount.txt
JSZipTestUtils.testZipFile("Zip text file with UTF-8 characters", "ref/utf8.zip", function(expected) {
    var zip = new JSZip();
    zip.file("amount.txt", "€15\n");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function (actual) {
        ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        JSZipTestUtils.checkGenerateStability(actual);
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

test("Text file with long unicode string", function() {
    var expected = "€";
    for(var i = 0; i < 13; i++) {
        expected = expected + expected;
    }
    var zip = new JSZip();
    zip.file("amount.txt", expected);
    stop();
    zip.generateAsync({type:"binarystring"})
    .then(JSZip.loadAsync)
    .then(function (zip) {
        var file = zip.file("amount.txt");
        return file.async("string");
    }).then(function (fileContent){
        equal(fileContent, expected, "Generated ZIP can be parsed");
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

// zip -X -0 utf8_in_name.zip €15.txt
JSZipTestUtils.testZipFile("Zip text file with UTF-8 characters in filename", "ref/utf8_in_name.zip", function(expected) {
    var zip = new JSZip();
    zip.file("€15.txt", "€15\n");
    stop();
    zip.generateAsync({type:"binarystring"}).then(function (actual) {
        // zip doesn't generate a strange file like us (utf8 flag AND unicode path extra field)
        // if one of the files has more data than the other, the bytes are no more aligned and the
        // error count goes through the roof. The parsing is checked on a other test so I'll
        // comment this one for now.
        // ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        JSZipTestUtils.checkGenerateStability(actual);
        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

// zip --entry-comments --archive-comment -X -0 pile_of_poo.zip Iñtërnâtiônàlizætiøn☃$'\360\237\222\251'.txt
JSZipTestUtils.testZipFile("Zip text file and UTF-8, Pile Of Poo test", "ref/pile_of_poo.zip", function(expected) {
    var zip = new JSZip();
    // this is the string "Iñtërnâtiônàlizætiøn☃💩",
    // see http://mathiasbynens.be/notes/javascript-unicode
    // but escaped, to avoid troubles
    // thanks http://mothereff.in/js-escapes#1I%C3%B1t%C3%ABrn%C3%A2ti%C3%B4n%C3%A0liz%C3%A6ti%C3%B8n%E2%98%83%F0%9F%92%A9
    var text = 'I\xF1t\xEBrn\xE2ti\xF4n\xE0liz\xE6ti\xF8n\u2603\uD83D\uDCA9';
    zip.file(text + ".txt", text, {comment : text});
    stop();
    zip.generateAsync({type:"binarystring", comment : text}).then(function(actual) {

        JSZipTestUtils.checkGenerateStability(actual);

        stop();
        JSZip.loadAsync(expected)
        .then(function (zip) {
            var file = zip.file(text + ".txt");
            ok(file, "JSZip finds the unicode file name on the external file");
            equal(file.comment, text, "JSZip can decode the external file comment");
            return file.async("string");
        })
        .then(function (content) {
            equal(content, text, "JSZip can decode the external file");
            start();
        })['catch'](JSZipTestUtils.assertNoError);


        stop();
        JSZip.loadAsync(actual)
        .then(function (zip) {
            var file = zip.file(text + ".txt");
            ok(file, "JSZip finds the unicode file name on its own file");
            equal(file.comment, text, "JSZip can decode its own file comment");
            return file.async("string");
        })
        .then(function (content) {
            equal(content, text, "JSZip can decode its own file");
            start();
        })['catch'](JSZipTestUtils.assertNoError);


        start();
    })['catch'](JSZipTestUtils.assertNoError);
});

