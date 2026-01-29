"use strict";

QUnit.module("unicode");

// zip -X -0 utf8.zip amount.txt
JSZipTestUtils.testZipFile("Zip text file with UTF-8 characters", "ref/utf8.zip", function(assert, expected) {
    var zip = new JSZip();
    zip.file("amount.txt", "€15\n");
    var done = assert.async();
    zip.generateAsync({type:"binarystring"}).then(function (actual) {
        assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        JSZipTestUtils.checkGenerateStability(assert, actual);
        done();
    })["catch"](JSZipTestUtils.assertNoError);
});

QUnit.test("Text file with long unicode string", function(assert) {
    var expected = "€";
    for(var i = 0; i < 13; i++) {
        expected = expected + expected;
    }
    var zip = new JSZip();
    zip.file("amount.txt", expected);
    var done = assert.async();
    zip.generateAsync({type:"binarystring"})
        .then(JSZip.loadAsync)
        .then(function (zip) {
            var file = zip.file("amount.txt");
            return file.async("string");
        }).then(function (fileContent){
            assert.equal(fileContent, expected, "Generated ZIP can be parsed");
            done();
        })["catch"](JSZipTestUtils.assertNoError);
});

// zip -X -0 utf8_in_name.zip €15.txt
JSZipTestUtils.testZipFile("Zip text file with UTF-8 characters in filename", "ref/utf8_in_name.zip", function(assert) {
    var zip = new JSZip();
    zip.file("€15.txt", "€15\n");
    var done = assert.async();
    zip.generateAsync({type:"binarystring"}).then(function (actual) {
        // zip doesn't generate a strange file like us (utf8 flag AND unicode path extra field)
        // if one of the files has more data than the other, the bytes are no more aligned and the
        // error count goes through the roof. The parsing is checked on a other test so I'll
        // comment this one for now.
        // assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        JSZipTestUtils.checkGenerateStability(assert, actual);
        done();
    })["catch"](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("Zip text file with non unicode characters in filename: loadAsync without decodeFileName", "ref/local_encoding_in_name.zip", function(assert, content) {

    var done = assert.async();
    JSZip.loadAsync(content).then(function (zipUnicode) {
        assert.ok(!zipUnicode.files["Новая папка/"], "default : the folder is not found");
        assert.ok(!zipUnicode.files["Новая папка/Новый текстовый документ.txt"], "default : the file is not found");
        done();
    })["catch"](JSZipTestUtils.assertNoError);

});

JSZipTestUtils.testZipFile("Zip text file with non unicode characters in filename: loadAsync with decodeFileName", "ref/local_encoding_in_name.zip", function(assert, content) {
    var conversions = {
        "bytes 8d ae a2 a0 ef 20 af a0 af aa a0 2f" : "Новая папка/",
        "bytes 8d ae a2 a0 ef 20 af a0 af aa a0 2f 8d ae a2 eb a9 20 e2 a5 aa e1 e2 ae a2 eb a9 20 a4 ae aa e3 ac a5 ad e2 2e 74 78 74" : "Новая папка/Новый текстовый документ.txt"
    };

    var done = assert.async();
    JSZip.loadAsync(content, {
        decodeFileName: function (bytes) {
            // here, a real iconv implementation
            var key = "bytes";
            for(var i = 0; i < bytes.length; i++) {
                key += " " + bytes[i].toString(16);
            }

            return conversions[key] || "";
        }
    }).then(function (zipCP866) {
        assert.ok(zipCP866.files["Новая папка/"], "with decodeFileName : the folder has been correctly read");
        assert.ok(zipCP866.files["Новая папка/Новый текстовый документ.txt"], "with decodeFileName : the file has been correctly read");
        done();
    })["catch"](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("Zip text file with non unicode characters in filename: generateAsync with encodeassert, fileName", "ref/local_encoding_in_name.zip", function(assert, content) {
    var conversions = {
        "": [],
        "Новая папка/": [0x8d, 0xae, 0xa2, 0xa0, 0xef, 0x20, 0xaf, 0xa0, 0xaf, 0xaa, 0xa0, 0x2f],
        "Новая папка/Новый текстовый документ.txt": [0x8d, 0xae, 0xa2, 0xa0, 0xef, 0x20, 0xaf, 0xa0, 0xaf, 0xaa, 0xa0, 0x2f, 0x8d, 0xae, 0xa2, 0xeb, 0xa9, 0x20, 0xe2, 0xa5, 0xaa, 0xe1, 0xe2, 0xae, 0xa2, 0xeb, 0xa9, 0x20, 0xa4, 0xae, 0xaa, 0xe3, 0xac, 0xa5, 0xad, 0xe2, 0x2e, 0x74, 0x78, 0x74]
    };

    function decodeCP866(bytes) {
        for(var text in conversions) {
            if (conversions[text].length === bytes.length) {
                return text;
            }
        }
    }

    function encodeCP866(string) {
        return conversions[string];
    }

    var done = assert.async();
    JSZip.loadAsync(content, {
        decodeFileName: decodeCP866
    }).then(function (zipCP866) {
        return zipCP866.generateAsync({
            type: "string",
            encodeFileName: encodeCP866
        });
    }).then(function (regeneratedContent) {
        return JSZip.loadAsync(regeneratedContent, {
            decodeFileName: decodeCP866
        });
    }).then(function (zipCP866) {
        // the example zip doesn't contain the unicode path extra field, we can't
        // compare them.
        assert.ok(zipCP866.files["Новая папка/"], "with decodeFileName : the folder has been correctly read");
        assert.ok(zipCP866.files["Новая папка/Новый текстовый документ.txt"], "with decodeFileName : the file has been correctly read");
        done();
    })["catch"](JSZipTestUtils.assertNoError);
});

// zip --entry-comments --archive-comment -X -0 pile_of_poo.zip Iñtërnâtiônàlizætiøn☃$'\360\237\222\251'.txt
JSZipTestUtils.testZipFile("Zip text file and UTF-8, Pile Of Poo test", "ref/pile_of_poo.zip", function(assert, expected) {
    var zip = new JSZip();
    // this is the string "Iñtërnâtiônàlizætiøn☃💩",
    // see http://mathiasbynens.be/notes/javascript-unicode
    // but escaped, to avoid troubles
    // thanks http://mothereff.in/js-escapes#1I%C3%B1t%C3%ABrn%C3%A2ti%C3%B4n%C3%A0liz%C3%A6ti%C3%B8n%E2%98%83%F0%9F%92%A9
    var text = "I\xF1t\xEBrn\xE2ti\xF4n\xE0liz\xE6ti\xF8n\u2603\uD83D\uDCA9";
    zip.file(text + ".txt", text, {comment : text});
    var done = assert.async(3);
    zip.generateAsync({type:"binarystring", comment : text}).then(function(actual) {

        JSZipTestUtils.checkGenerateStability(assert, actual);

        JSZip.loadAsync(expected)
            .then(function (zip) {
                var file = zip.file(text + ".txt");
                assert.ok(file, "JSZip finds the unicode file name on the external file");
                assert.equal(file.comment, text, "JSZip can decode the external file comment");
                return file.async("string");
            })
            .then(function (content) {
                assert.equal(content, text, "JSZip can decode the external file");
                done();
            })["catch"](JSZipTestUtils.assertNoError);

        JSZip.loadAsync(actual)
            .then(function (zip) {
                var file = zip.file(text + ".txt");
                assert.ok(file, "JSZip finds the unicode file name on its own file");
                assert.equal(file.comment, text, "JSZip can decode its own file comment");
                return file.async("string");
            })
            .then(function (content) {
                assert.equal(content, text, "JSZip can decode its own file");
                done();
            })["catch"](JSZipTestUtils.assertNoError);


        done();
    })["catch"](JSZipTestUtils.assertNoError);
});

QUnit.test("Astral characters at chunk boundary should not produce CESU-8", function(assert) {
    // Test that surrogate pairs split across chunk boundaries are correctly
    // encoded as 4-byte UTF-8 sequences, not as two 3-byte CESU-8 sequences.
    // This bug occurred because DataWorker.substring() can split surrogate pairs.
    var BLOCK_SIZE = 16 * 1024; // JSZip's internal chunk size
    
    // Position an astral character (U+1F600, 😀) right at the chunk boundary
    var padding = "";
    for (var i = 0; i < BLOCK_SIZE - 1; i++) {
        padding += "x";
    }
    // U+1F600 is represented as surrogate pair \uD83D\uDE00 in JavaScript
    var emoji = "\uD83D\uDE00";
    var testStr = padding + emoji + "end";
    
    var zip = new JSZip();
    zip.file("test.txt", testStr);
    
    return zip.generateAsync({type:"uint8array"})
        .then(function(zipData) {
            return JSZip.loadAsync(zipData);
        })
        .then(function(loadedZip) {
            return loadedZip.file("test.txt").async("uint8array");
        })
        .then(function(bytes) {
            // Check for CESU-8 sequences (ED xx xx pattern for surrogates)
            var foundCesu8 = false;
            for (var j = 0; j < bytes.length - 2; j++) {
                if (bytes[j] === 0xED && bytes[j+1] >= 0xA0 && bytes[j+1] <= 0xBF) {
                    foundCesu8 = true;
                    break;
                }
            }
            assert.ok(!foundCesu8, "No CESU-8 sequences should be present");
            
            // Also verify the content round-trips correctly
            return JSZip.loadAsync(zip.generateAsync({type:"uint8array"}));
        })
        .then(function(reloadedZip) {
            return reloadedZip.file("test.txt").async("string");
        })
        .then(function(content) {
            assert.equal(content, testStr, "Content should round-trip correctly");
        });
});
