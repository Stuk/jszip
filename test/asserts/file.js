/* jshint qunit: true */
/* global JSZip,JSZipTestUtils,Promise,BlobBuilder */
'use strict';

QUnit.module("file", function () {

    function str2blob (str) {
        var u8 = new Uint8Array(str.length);
        for(var i = 0; i < str.length; i++) {
            u8[i] = str.charCodeAt(i);
        }
        try {
            // don't use an Uint8Array, see the comment on utils.newBlob
            return new Blob([u8.buffer], {type:"text/plain"});
        } catch (e) {
            var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            var builder = new Builder();
            builder.append(u8.buffer);
            return builder.getBlob("text/plain");
        }
    }

    QUnit.module("add");

    JSZipTestUtils.testZipFile("Zip text file !", "ref/text.zip", function(expected) {
        QUnit.stop();
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n");
        JSZipTestUtils.checkBasicStreamBehavior(zip.generateInternalStream({type:"binarystring"}));
        zip.generateAsync({type:"binarystring"}).then(function (actual) {
            QUnit.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(actual);
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("Zip text, folder and image", "ref/all.zip", function(expected) {
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n");
        zip.folder("images").file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
        QUnit.stop();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            QUnit.ok(JSZipTestUtils.similar(actual, expected, 3 * JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(actual);
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("Add a file to overwrite", "ref/text.zip", function(expected) {
        var zip = new JSZip();
        zip.file("Hello.txt", "hello ?");
        zip.file("Hello.txt", "Hello World\n");

        QUnit.stop();
        zip.generateAsync({type:"binarystring"}).then(function (actual) {
            QUnit.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(actual);
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("Zip text file with date", "ref/text.zip", function(expected) {
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n", {date : new Date("July 17, 2009 14:36:57")});
        QUnit.stop();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            /*
               Expected differing bytes:
               2  version number
               4  central dir version numbers
               4  external file attributes

               10 Total
               */
            QUnit.ok(JSZipTestUtils.similar(actual, expected, 10) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(actual);
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });


    JSZipTestUtils.testZipFile("Zip image file", "ref/image.zip", function(expected) {
        var zip = new JSZip();
        zip.file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
        QUnit.stop();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            QUnit.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(actual);
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("add file: from XHR (with bytes > 255)", "ref/text.zip", function(textZip) {
        var zip = new JSZip();
        zip.file("text.zip", textZip, {binary:true});
        QUnit.stop();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            // high-order byte is discarded and won't mess up the result
            JSZipTestUtils.checkGenerateStability(actual);
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    QUnit.test("add file: wrong string as base64", function(assert) {
        var zip = new JSZip();
        zip.file("text.txt", "a random string", {base64:true});
        QUnit.stop();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            assert.ok(false, "generateAsync should fail");
            QUnit.start();
        })['catch'](function (e) {
            assert.equal(e.message, "Invalid base64 input, bad content length.", "triggers the correct error");
            QUnit.start();
        });
    });

    QUnit.test("add file: data url instead of base64", function(assert) {
        var zip = new JSZip();
        zip.file("text.txt", "data:image/png;base64,YmFzZTY0", {base64:true});
        QUnit.stop();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            assert.ok(false, "generateAsync should fail");
            QUnit.start();
        })['catch'](function (e) {
            assert.equal(e.message, "Invalid base64 input, it looks like a data url.", "triggers the correct error");
            QUnit.start();
        });
    });

    function testFileDataGetters (opts) {
        if (typeof opts.rawData === "undefined") {
            opts.rawData = opts.textData;
        }
        _actualTestFileDataGetters.testGetter(opts, "string");
        _actualTestFileDataGetters.testGetter(opts, "text");
        _actualTestFileDataGetters.testGetter(opts, "base64");
        _actualTestFileDataGetters.testGetter(opts, "array");
        _actualTestFileDataGetters.testGetter(opts, "binarystring");
        _actualTestFileDataGetters.testGetter(opts, "arraybuffer");
        _actualTestFileDataGetters.testGetter(opts, "uint8array");
        _actualTestFileDataGetters.testGetter(opts, "nodebuffer");
        _actualTestFileDataGetters.testGetter(opts, "blob");
        _actualTestFileDataGetters.testGetter(opts, "unknown");
        _actualTestFileDataGetters.testGetter(opts, null);

        QUnit.stop();
        opts.zip.generateAsync({type:"binarystring"})
        .then(JSZip.loadAsync)
        .then(function(zip) {
            var reloaded = {
                name : "(reloaded) " + opts.name,
                zip : zip,
                textData : opts.textData,
                rawData : opts.rawData
            };
            _actualTestFileDataGetters.testGetter(reloaded, "string");
            _actualTestFileDataGetters.testGetter(reloaded, "text");
            _actualTestFileDataGetters.testGetter(reloaded, "base64");
            _actualTestFileDataGetters.testGetter(reloaded, "array");
            _actualTestFileDataGetters.testGetter(reloaded, "binarystring");
            _actualTestFileDataGetters.testGetter(reloaded, "arraybuffer");
            _actualTestFileDataGetters.testGetter(reloaded, "uint8array");
            _actualTestFileDataGetters.testGetter(reloaded, "nodebuffer");
            _actualTestFileDataGetters.testGetter(reloaded, "blob");
            _actualTestFileDataGetters.testGetter(reloaded, "unknown");
            _actualTestFileDataGetters.testGetter(reloaded, null);

            opts.zip.file("file.txt", "changing the content after the call won't change the result");
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);

        opts.zip.file("file.txt", "changing the content after the call won't change the result");
    }

    var _actualTestFileDataGetters = {
        testGetter : function (opts, askedType) {
            var asyncTestName = "[test = " + opts.name + "] [method = async(" + askedType + ")] ";

            var err = null, content = null;

            var stream = opts.zip.file("file.txt").internalStream(askedType);
            JSZipTestUtils.checkBasicStreamBehavior(stream, asyncTestName);

            opts.zip.file("file.txt").async(askedType).then(function(result) {
                _actualTestFileDataGetters["assert_" + askedType](opts, null, result, asyncTestName);
            }, function (err) {
                _actualTestFileDataGetters["assert_" + askedType](opts, err, null, asyncTestName);
            });
        },
        assert_string: function (opts, err, txt, testName) {
            QUnit.equal(err, null, testName + "no error");
            QUnit.equal(txt, opts.textData, testName + "content ok");
        },
        assert_text: function () {
            this.assert_string.apply(this, arguments);
        },
        assert_base64: function (opts, err, bin, testName) {
            QUnit.equal(err, null, testName + "no error");
            QUnit.equal(bin, JSZipTestUtils.base64encode(opts.rawData), testName + "content ok");
        },
        assert_binarystring : function (opts, err, bin, testName) {
            QUnit.equal(err, null, testName + "no error");
            QUnit.equal(bin, opts.rawData, testName + "content ok");
        },
        assert_array : function (opts, err, array, testName) {
            QUnit.equal(err, null, testName + "no error");
            QUnit.ok(array instanceof Array, testName + "the result is a instance of Array");
            var actual = JSZipTestUtils.toString(array);
            QUnit.equal(actual, opts.rawData, testName + "content ok");
        },
        assert_arraybuffer : function (opts, err, buffer, testName) {
            if (JSZip.support.arraybuffer) {
                QUnit.equal(err, null, testName + "no error");
                QUnit.ok(buffer instanceof ArrayBuffer, testName + "the result is a instance of ArrayBuffer");
                var actual = JSZipTestUtils.toString(buffer);
                QUnit.equal(actual, opts.rawData, testName + "content ok");
            } else {
                QUnit.equal(buffer, null, testName + "no data");
                QUnit.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
            }
        },
        assert_uint8array : function (opts, err, bufferView, testName) {
            if (JSZip.support.uint8array) {
                QUnit.equal(err, null, testName + "no error");
                QUnit.ok(bufferView instanceof Uint8Array, testName+ "the result is a instance of Uint8Array");
                var actual = JSZipTestUtils.toString(bufferView);
                QUnit.equal(actual, opts.rawData, testName + "content ok");
            } else {
                QUnit.equal(bufferView, null, testName + "no data");
                QUnit.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
            }
        },
        assert_nodebuffer : function (opts, err, buffer, testName) {
            if (JSZip.support.nodebuffer) {
                QUnit.equal(err, null, testName + "no error");
                QUnit.ok(buffer instanceof Buffer, testName + "the result is a instance of Buffer");
                var actual = JSZipTestUtils.toString(buffer);
                QUnit.equal(actual, opts.rawData, testName + "content ok");
            } else {
                QUnit.equal(buffer, null, testName + "no data");
                QUnit.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
            }
        },
        assert_blob : function (opts, err, blob, testName) {
            if (JSZip.support.blob) {
                QUnit.equal(err, null, testName + "no error");
                QUnit.ok(blob instanceof Blob, testName + "the result is a instance of Blob");
                QUnit.equal(blob.type,  "", testName + "the result has the rigth mime type");
                QUnit.equal(blob.size, opts.rawData.length, testName + "the result has the right length");
            } else {
                QUnit.equal(blob, null, testName + "no data");
                QUnit.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
            }
        },
        assert_unknown : function (opts, err, buffer, testName) {
            QUnit.equal(buffer, null, testName + "no data");
            QUnit.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
        },
        assert_null : function (opts, err, buffer, testName) {
            QUnit.equal(buffer, null, testName + "no data");
            QUnit.ok(err.message.match("No output type specified"), testName + "the error message is useful");
        }
    };

    QUnit.test("add file: file(name, undefined)", function() {
        var zip = new JSZip(), undef;
        zip.file("file.txt", undef);
        testFileDataGetters({name : "undefined", zip : zip, textData : ""});

        zip = new JSZip();
        zip.file("file.txt", undef, {binary:true});
        testFileDataGetters({name : "undefined as binary", zip : zip, textData : ""});

        zip = new JSZip();
        zip.file("file.txt", undef, {base64:true});
        testFileDataGetters({name : "undefined as base64", zip : zip, textData : ""});
    });

    QUnit.test("add file: file(name, null)", function() {
        var zip = new JSZip();
        zip.file("file.txt", null);
        testFileDataGetters({name : "null", zip : zip, textData : ""});

        zip = new JSZip();
        zip.file("file.txt", null, {binary:true});
        testFileDataGetters({name : "null as binary", zip : zip, textData : ""});

        zip = new JSZip();
        zip.file("file.txt", null, {base64:true});
        testFileDataGetters({name : "null as base64", zip : zip, textData : ""});
    });

    QUnit.test("add file: file(name, stringAsText)", function() {
        var zip = new JSZip();
        zip.file("file.txt", "€15\n", {binary:false});
        testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", "test\r\ntest\r\n", {binary:false});
        testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
    });

    QUnit.test("add file: file(name, stringAsBinary)", function() {
        var zip = new JSZip();
        zip.file("file.txt", "\xE2\x82\xAC15\n", {binary:true});
        testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", "test\r\ntest\r\n", {binary:true});
        testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
    });

    QUnit.test("add file: file(name, array)", function() {
        var zip = new JSZip();
        function toArray(str) {
            var array = new Array(str.length);
            for (var i = 0; i < str.length; i++) {
                array[i] = str.charCodeAt(i);
            }
            return array;
        }
        zip.file("file.txt", toArray("\xE2\x82\xAC15\n"), {binary:true});
        testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", toArray("test\r\ntest\r\n"), {binary:true});
        testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
    });

    QUnit.test("add file: file(name, base64)", function() {
        var zip = new JSZip();
        zip.file("file.txt", "4oKsMTUK", {base64:true});
        testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", "dGVzdA0KdGVzdA0K", {base64:true});
        testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
    });

    QUnit.test("add file: file(name, unsupported)", function() {
        QUnit.stop();
        var zip = new JSZip();
        zip.file("test.txt", new Date());

        zip.file("test.txt")
        .async("string")
        // XXX zip.file(name, data) returns a ZipObject for chaining,
        // we need to try to get the value to get the error
        .then(function () {
            QUnit.start();
            QUnit.ok(false, "An unsupported object was added, but no exception thrown");
        }, function (e) {
            QUnit.start();
            QUnit.ok(e.message.match("Is it in a supported JavaScript type"), "the error message is useful");
        });
    });

    if (JSZip.support.uint8array) {
        QUnit.test("add file: file(name, Uint8Array)", function() {
            var str2array = function (str) {
                var array = new Uint8Array(str.length);
                for(var i = 0; i < str.length; i++) {
                    array[i] = str.charCodeAt(i);
                }
                return array;
            };
            var zip = new JSZip();
            zip.file("file.txt", str2array("\xE2\x82\xAC15\n"));
            testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2array("test\r\ntest\r\n"));
            testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2array(""));
            testFileDataGetters({name : "empty content", zip : zip, textData : ""});
        });
    }

    if (JSZip.support.arraybuffer) {
        QUnit.test("add file: file(name, ArrayBuffer)", function() {
            var str2buffer = function (str) {
                var array = new Uint8Array(str.length);
                for(var i = 0; i < str.length; i++) {
                    array[i] = str.charCodeAt(i);
                }
                return array.buffer;
            };
            var zip = new JSZip();
            zip.file("file.txt", str2buffer("\xE2\x82\xAC15\n"));
            testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2buffer("test\r\ntest\r\n"));
            testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2buffer(""));
            testFileDataGetters({name : "empty content", zip : zip, textData : ""});
        });
    }

    if (JSZip.support.blob) {
        QUnit.test("add file: file(name, Blob)", function() {
            var zip = new JSZip();
            zip.file("file.txt", str2blob("\xE2\x82\xAC15\n"));
            testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2blob("test\r\ntest\r\n"));
            testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2blob(""));
            testFileDataGetters({name : "empty content", zip : zip, textData : ""});
        });
    }

    if (typeof Promise !== "undefined") {
        QUnit.test("add file: file(name, native Promise)", function() {
            var str2promise = function (str) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function () {
                        resolve(str);
                    }, 10);
                });
            };
            var zip = new JSZip();
            zip.file("file.txt", str2promise("\xE2\x82\xAC15\n"));
            testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2promise("test\r\ntest\r\n"));
            testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2promise(""));
            testFileDataGetters({name : "empty content", zip : zip, textData : ""});
        });
    }

    QUnit.test("add file: file(name, polyfill Promise[string] as binary)", function() {
        var str2promise = function (str) {
            return new JSZip.external.Promise(function(resolve, reject) {
                setTimeout(function () {
                    resolve(str);
                }, 10);
            });
        };
        var zip = new JSZip();
        zip.file("file.txt", str2promise("\xE2\x82\xAC15\n"), {binary: true});
        testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});
    });

    QUnit.test("add file: file(name, polyfill Promise[string] force text)", function() {
        var str2promise = function (str) {
            return new JSZip.external.Promise(function(resolve, reject) {
                setTimeout(function () {
                    resolve(str);
                }, 10);
            });
        };
        var zip = new JSZip();
        zip.file("file.txt", str2promise("€15\n"), {binary: false});
        testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});
    });

    /*
     * Fix #325 for this one
     *
    QUnit.test("add file: file(name, polyfill Promise[string] as text)", function() {
        var str2promise = function (str) {
            return new JSZip.external.Promise(function(resolve, reject) {
                setTimeout(function () {
                    resolve(str);
                }, 10);
            });
        };
        var zip = new JSZip();
        zip.file("file.txt", str2promise("€15\n"));
        testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", str2promise("test\r\ntest\r\n"));
        testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

        zip = new JSZip();
        zip.file("file.txt", str2promise(""));
        testFileDataGetters({name : "empty content", zip : zip, textData : ""});
    });
   */

    if (JSZip.support.blob) {
        QUnit.test("add file: file(name, polyfill Promise[Blob])", function() {
            var str2promiseOfBlob = function (str) {
                return new JSZip.external.Promise(function(resolve, reject) {
                    setTimeout(function () {
                        resolve(str2blob(str));
                    }, 10);
                });
            };
            var zip = new JSZip();
            zip.file("file.txt", str2promiseOfBlob("\xE2\x82\xAC15\n"));
            testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2promiseOfBlob("test\r\ntest\r\n"));
            testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2promiseOfBlob(""));
            testFileDataGetters({name : "empty content", zip : zip, textData : ""});
        });
    }

    if (JSZip.support.nodebuffer) {
        QUnit.test("add file: file(name, Buffer)", function() {
            var str2buffer = function (str) {
                var array = new Buffer(str.length);
                for(var i = 0; i < str.length; i++) {
                    array[i] = str.charCodeAt(i);
                }
                return array;
            };
            var zip = new JSZip();
            zip.file("file.txt", str2buffer("\xE2\x82\xAC15\n"));
            testFileDataGetters({name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2buffer("test\r\ntest\r\n"));
            testFileDataGetters({name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2buffer(""));
            testFileDataGetters({name : "empty content", zip : zip, textData : ""});
        });
    }


    QUnit.module("about folders");

    QUnit.test("Zip folder() shouldn't throw an exception", function() {
        var zip = new JSZip();
        try {
            zip.folder();
            QUnit.ok(true, "no exception thrown");
        } catch (e) {
            QUnit.ok(false, e.message||e);
        }
    });

    JSZipTestUtils.testZipFile("Zip empty folder", "ref/folder.zip", function(expected) {
        var zip = new JSZip();
        zip.folder("folder");
        QUnit.stop();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            QUnit.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(actual);
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    QUnit.test("file() creates a folder with dir:true", function () {
        var zip = new JSZip();
        zip.file("folder", null, {
            dir : true
        });
        QUnit.ok(zip.files['folder/'].dir, "the folder with options is marked as a folder");
    });

    QUnit.test("file() creates a folder with the right unix permissions", function () {
        var zip = new JSZip();
        zip.file("folder", null, {
            unixPermissions : parseInt("40500", 8)
        });
        QUnit.ok(zip.files['folder/'].dir, "the folder with options is marked as a folder");
    });

    QUnit.test("file() creates a folder with the right dos permissions", function () {
        var zip = new JSZip();
        zip.file("folder", null, {
            dosPermissions : parseInt("010000", 2)
        });
        QUnit.ok(zip.files['folder/'].dir, "the folder with options is marked as a folder");
    });

    QUnit.test("A folder stays a folder when created with file", function () {
        var referenceDate = new Date("July 17, 2009 14:36:56");
        var referenceComment = "my comment";
        var zip = new JSZip();
        zip.file("folder", null, {
            dir : true,
            date : referenceDate,
            comment : referenceComment,
            unixPermissions : parseInt("40500", 8)
        });

        QUnit.ok(zip.files['folder/'].dir, "the folder with options is marked as a folder");
        QUnit.equal(zip.files['folder/'].date.getTime(), referenceDate.getTime(), "the folder with options has the correct date");
        QUnit.equal(zip.files['folder/'].comment, referenceComment, "the folder with options has the correct comment");
        QUnit.equal(zip.files['folder/'].unixPermissions.toString(8), "40500", "the folder with options has the correct UNIX permissions");

        QUnit.stop();
        zip.generateAsync({type:"string", platform:"UNIX"})
        .then(JSZip.loadAsync)
        .then(function (reloaded) {
            QUnit.start();
            QUnit.ok(reloaded.files['folder/'].dir, "the folder with options is marked as a folder");

            QUnit.ok(reloaded.files['folder/'].dir, "the folder with options is marked as a folder");
            QUnit.equal(reloaded.files['folder/'].date.getTime(), referenceDate.getTime(), "the folder with options has the correct date");
            QUnit.equal(reloaded.files['folder/'].comment, referenceComment, "the folder with options has the correct comment");
            QUnit.equal(reloaded.files['folder/'].unixPermissions.toString(8), "40500", "the folder with options has the correct UNIX permissions");
        })['catch'](JSZipTestUtils.assertNoError);

    });

    QUnit.test("file() adds a slash for directories", function () {
        var zip = new JSZip();
        zip.file("folder_without_slash", null, {
            dir : true
        });
        zip.file("folder_with_slash/", null, {
            dir : true
        });
        QUnit.ok(zip.files['folder_without_slash/'], "added a slash if not provided");
        QUnit.ok(zip.files['folder_with_slash/'], "keep the existing slash");
    });

    QUnit.test("folder() doesn't overwrite existing entries", function () {
        var referenceComment = "my comment";
        var zip = new JSZip();
        zip.file("folder", null, {
            dir : true,
            comment : referenceComment,
            unixPermissions : parseInt("40500", 8)
        });

        // calling folder() doesn't override it
        zip.folder("folder");

        QUnit.equal(zip.files['folder/'].comment, referenceComment, "the folder with options has the correct comment");
        QUnit.equal(zip.files['folder/'].unixPermissions.toString(8), "40500", "the folder with options has the correct UNIX permissions");
    });

    QUnit.test("createFolders works on a file", function () {
        var zip = new JSZip();
        zip.file("false/0/1/2/file", "content", {createFolders:false, unixPermissions:"644"});
        zip.file("true/0/1/2/file", "content", {createFolders:true, unixPermissions:"644"});

        QUnit.ok(!zip.files["false/"], "the false/ folder doesn't exist");
        QUnit.ok(zip.files["true/"], "the true/ folder exists");
        QUnit.equal(zip.files["true/"].unixPermissions, null, "the options are not propagated");
    });

    QUnit.test("createFolders works on a folder", function () {
        var zip = new JSZip();
        zip.file("false/0/1/2/folder", null, {createFolders:false, unixPermissions:"777",dir:true});
        zip.file("true/0/1/2/folder", null, {createFolders:true, unixPermissions:"777",dir:true});

        QUnit.ok(!zip.files["false/"], "the false/ folder doesn't exist");
        QUnit.ok(zip.files["true/"], "the true/ folder exists");
        QUnit.equal(zip.files["true/"].unixPermissions, null, "the options are not propagated");
    });

    QUnit.test("folder follows the default createFolders settings", function () {
        var zip = new JSZip();
        zip.folder("true/0/1/2/folder");
        QUnit.ok(zip.files["true/"], "the true/ folder exists");
    });


    QUnit.test("A folder stays a folder", function () {
        var zip = new JSZip();
        zip.folder("folder/");
        QUnit.ok(zip.files['folder/'].dir, "the folder is marked as a folder");


        QUnit.stop();

        zip.generateAsync({type:"binarystring"})
        .then(JSZip.loadAsync)
        .then(function (reloaded) {
            QUnit.ok(reloaded.files['folder/'].dir, "the folder is marked as a folder");
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    QUnit.test("Folders are created by default", function() {
        var zip = new JSZip();
        zip.file("test/Readme", "Hello World!\n");
        QUnit.ok(zip.files["test/Readme"], "the file exists");
        QUnit.ok(zip.files["test/"], "the folder exists");
    });

    QUnit.test("Folders can be avoided with createFolders", function() {
        var zip = new JSZip();
        zip.file("test/Readme", "Hello World!\n", {createFolders: false});
        QUnit.ok(zip.files["test/Readme"], "the file exists");
        QUnit.ok(!zip.files["test/"], "the folder doesn't exist");
    });

    QUnit.module("find entries");


    QUnit.test("Finding a file", function(assert) {
        var zip = new JSZip();
        zip.file("Readme", "Hello World!\n");
        zip.file("Readme.French", "Bonjour tout le monde!\n");
        zip.file("Readme.Pirate", "Ahoy m'hearty!\n");

        QUnit.stop();
        zip.file("Readme.French").async("string").then(function (content) {
            assert.equal(content, "Bonjour tout le monde!\n", "Exact match found");
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
        assert.equal(zip.file("Readme.Deutsch"), null, "Match exactly nothing");
        assert.equal(zip.file(/Readme\../).length, 2, "Match regex free text");
        assert.equal(zip.file(/pirate/i).length, 1, "Match regex 1 result");
    });

    QUnit.test("Finding a file (text search) with a relative folder", function() {
        var zip = new JSZip();
        zip.folder("files/default").file("Readme", "Hello World!\n");
        zip.folder("files/translation").file("Readme.French", "Bonjour tout le monde!\n");
        zip.folder("files").folder("translation").file("Readme.Pirate", "Ahoy m'hearty!\n");

        QUnit.stop();
        zip.file("files/translation/Readme.French").async("string").then(function (content) {
            QUnit.equal(content, "Bonjour tout le monde!\n", "finding file with the full path");
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
        QUnit.stop();
        zip.folder("files").file("translation/Readme.French").async("string").then(function (content) {
            QUnit.equal(content, "Bonjour tout le monde!\n", "finding file with a relative path");
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
        QUnit.stop();
        zip.folder("files/translation").file("Readme.French").async("string").then(function (content) {
            QUnit.equal(content, "Bonjour tout le monde!\n", "finding file with a relative path");
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    QUnit.test("Finding files (regex) with a relative folder", function() {
        var zip = new JSZip();
        zip.folder("files/default").file("Readme", "Hello World!\n");
        zip.folder("files/translation").file("Readme.French", "Bonjour tout le monde!\n");
        zip.folder("files").folder("translation").file("Readme.Pirate", "Ahoy m'hearty!\n");

        QUnit.equal(zip.file(/Readme/).length, 3, "match files in subfolders");
        QUnit.equal(zip.folder("files/translation").file(/Readme/).length, 2, "regex match only in subfolders");
        QUnit.equal(zip.folder("files").folder("translation").file(/Readme/).length, 2, "regex match only in subfolders");
        QUnit.equal(zip.folder("files/translation").file(/pirate/i).length, 1, "regex match only in subfolders");
        QUnit.equal(zip.folder("files/translation").file(/^readme/i).length, 2, "regex match only with the relative path");
        QUnit.equal(zip.folder("files/default").file(/pirate/i).length, 0, "regex match only in subfolders");
    });

    QUnit.test("Finding folders", function () {
        var zip = new JSZip();
        zip.folder("root/").folder("sub1/");
        zip.folder("root/sub2/subsub1");

        QUnit.equal(zip.folder(/sub2\/$/).length, 1, "unique result");
        QUnit.equal(zip.folder(/sub1/).length, 2, "multiple results");
        QUnit.equal(zip.folder(/root/).length, 4, "match on whole path");
    });

    QUnit.test("Finding folders with relative path", function () {
        var zip = new JSZip();
        zip.folder("root/").folder("sub1/");
        zip.folder("root/sub2/subsub1");
        var root = zip.folder("root/sub2");

        QUnit.equal(root.folder(/sub2\/$/).length, 0, "current folder is not matched");
        QUnit.equal(root.folder(/sub1/).length, 1, "sub folder is matched");
        QUnit.equal(root.folder(/^subsub1/).length, 1, "relative folder path is used");
        QUnit.equal(root.folder(/root/).length, 0, "parent folder is not matched");
    });

    function zipObjectsAssertions(zipObject) {
        var date = new Date("July 17, 2009 14:36:57");

        QUnit.equal(zipObject.name, "Hello.txt", "ZipObject#name is here");

        QUnit.equal(zipObject.comment, "my comment", "ZipObject#comment is here");

        // the zip date has a 2s resolution
        var delta = Math.abs(zipObject.date.getTime() - date.getTime());
        QUnit.ok(delta < 2000/* ms */, date, "ZipObject#date is here");
    }
    QUnit.test("ZipObject attributes", function () {
        var date = new Date("July 17, 2009 14:36:57");
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n", {comment:"my comment", date:date});
        zipObjectsAssertions(zip.file("Hello.txt"));
        zipObjectsAssertions(zip.files["Hello.txt"]);
        QUnit.stop();
        zip.generateAsync({type:"binarystring"})
        .then(JSZip.loadAsync)
        .then(function(reloaded) {
            zipObjectsAssertions(reloaded.file("Hello.txt"));
            zipObjectsAssertions(reloaded.files["Hello.txt"]);
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });
    QUnit.test("generate uses updated ZipObject date attribute", function () {
        var date = new Date("July 17, 2009 14:36:57");
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n", {comment:"my comment"}); // date = now
        zip.files["Hello.txt"].date = date;
        QUnit.stop();
        zip.generateAsync({type:"binarystring"})
        .then(JSZip.loadAsync)
        .then(function(reloaded) {
            zipObjectsAssertions(reloaded.file("Hello.txt"));
            zipObjectsAssertions(reloaded.files["Hello.txt"]);
            QUnit.start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

});


