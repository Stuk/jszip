"use strict";

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

    JSZipTestUtils.testZipFile("Zip text file !", "ref/text.zip", function(assert, expected) {
        var done = assert.async();
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n");
        JSZipTestUtils.checkBasicStreamBehavior(assert, zip.generateInternalStream({type:"binarystring"}));
        zip.generateAsync({type:"binarystring"}).then(function (actual) {
            assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(assert, actual);
            done();
        })["catch"](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("Zip text, folder and image", "ref/all.zip", function(assert, expected) {
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n");
        zip.folder("images").file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
        var done = assert.async();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            assert.ok(JSZipTestUtils.similar(actual, expected, 3 * JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(assert, actual);
            done();
        })["catch"](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("Add a file to overwrite", "ref/text.zip", function(assert, expected) {
        var zip = new JSZip();
        zip.file("Hello.txt", "hello ?");
        zip.file("Hello.txt", "Hello World\n");

        var done = assert.async();
        zip.generateAsync({type:"binarystring"}).then(function (actual) {
            assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(assert, actual);
            done();
        })["catch"](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("Zip text file with date", "ref/text.zip", function(assert, expected) {
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n", {date : new Date("July 17, 2009 14:36:57")});
        var done = assert.async();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            /*
               Expected differing bytes:
               2  version number
               4  central dir version numbers
               4  external file attributes

               10 Total
               */
            assert.ok(JSZipTestUtils.similar(actual, expected, 10) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(assert, actual);
            done();
        })["catch"](JSZipTestUtils.assertNoError);
    });


    JSZipTestUtils.testZipFile("Zip image file", "ref/image.zip", function(assert, expected) {
        var zip = new JSZip();
        zip.file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
        var done = assert.async();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(assert, actual);
            done();
        })["catch"](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("add file: from XHR (with bytes > 255)", "ref/text.zip", function(assert, textZip) {
        var zip = new JSZip();
        zip.file("text.zip", textZip, {binary:true});
        var done = assert.async();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            // high-order byte is discarded and won't mess up the result
            JSZipTestUtils.checkGenerateStability(assert, actual);
            done();
        })["catch"](JSZipTestUtils.assertNoError);
    });

    QUnit.test("add file: wrong string as base64", function(assert) {
        var zip = new JSZip();
        zip.file("text.txt", "a random string", {base64:true});
        var done = assert.async();
        zip.generateAsync({type:"binarystring"}).then(function() {
            assert.ok(false, "generateAsync should fail");
            done();
        })["catch"](function (e) {
            assert.equal(e.message, "Invalid base64 input, bad content length.", "triggers the correct error");
            done();
        });
    });

    QUnit.test("add file: data url instead of base64", function(assert) {
        var zip = new JSZip();
        zip.file("text.txt", "data:image/png;base64,YmFzZTY0", {base64:true});
        var done = assert.async();
        zip.generateAsync({type:"binarystring"}).then(function() {
            assert.ok(false, "generateAsync should fail");
            done();
        })["catch"](function (e) {
            assert.equal(e.message, "Invalid base64 input, it looks like a data url.", "triggers the correct error");
            done();
        });
    });

    function testFileDataGetters (assert, opts) {
        if (typeof opts.rawData === "undefined") {
            opts.rawData = opts.textData;
        }
        _actualTestFileDataGetters.testGetter(assert, opts, "string");
        _actualTestFileDataGetters.testGetter(assert, opts, "text");
        _actualTestFileDataGetters.testGetter(assert, opts, "base64");
        _actualTestFileDataGetters.testGetter(assert, opts, "array");
        _actualTestFileDataGetters.testGetter(assert, opts, "binarystring");
        _actualTestFileDataGetters.testGetter(assert, opts, "arraybuffer");
        _actualTestFileDataGetters.testGetter(assert, opts, "uint8array");
        _actualTestFileDataGetters.testGetter(assert, opts, "nodebuffer");
        _actualTestFileDataGetters.testGetter(assert, opts, "blob");
        _actualTestFileDataGetters.testGetter(assert, opts, "unknown");
        _actualTestFileDataGetters.testGetter(assert, opts, null);

        var done = assert.async();
        opts.zip.generateAsync({type:"binarystring"})
            .then(JSZip.loadAsync)
            .then(function(zip) {
                var reloaded = {
                    name : "(reloaded) " + opts.name,
                    zip : zip,
                    textData : opts.textData,
                    rawData : opts.rawData
                };
                _actualTestFileDataGetters.testGetter(assert, reloaded, "string");
                _actualTestFileDataGetters.testGetter(assert, reloaded, "text");
                _actualTestFileDataGetters.testGetter(assert, reloaded, "base64");
                _actualTestFileDataGetters.testGetter(assert, reloaded, "array");
                _actualTestFileDataGetters.testGetter(assert, reloaded, "binarystring");
                _actualTestFileDataGetters.testGetter(assert, reloaded, "arraybuffer");
                _actualTestFileDataGetters.testGetter(assert, reloaded, "uint8array");
                _actualTestFileDataGetters.testGetter(assert, reloaded, "nodebuffer");
                _actualTestFileDataGetters.testGetter(assert, reloaded, "blob");
                _actualTestFileDataGetters.testGetter(assert, reloaded, "unknown");
                _actualTestFileDataGetters.testGetter(assert, reloaded, null);

                opts.zip.file("file.txt", "changing the content after the call won't change the result");
                done();
            })["catch"](JSZipTestUtils.assertNoError);

        opts.zip.file("file.txt", "changing the content after the call won't change the result");
    }

    var _actualTestFileDataGetters = {
        testGetter : function (assert, opts, askedType) {
            var asyncTestName = "[test = " + opts.name + "] [method = async(" + askedType + ")] ";

            var stream = opts.zip.file("file.txt").internalStream(askedType);
            JSZipTestUtils.checkBasicStreamBehavior(assert, stream, asyncTestName);

            var done = assert.async();
            opts.zip.file("file.txt").async(askedType).then(function(result) {
                _actualTestFileDataGetters["assert_" + askedType](opts, null, result, asyncTestName);
                done();
            }, function (err) {
                _actualTestFileDataGetters["assert_" + askedType](opts, err, null, asyncTestName);
                done();
            });
        },
        assert_string: function (opts, err, txt, testName) {
            QUnit.assert.equal(err, null, testName + "no error");
            QUnit.assert.equal(txt, opts.textData, testName + "content ok");
        },
        assert_text: function () {
            this.assert_string.apply(this, arguments);
        },
        assert_base64: function (opts, err, bin, testName) {
            QUnit.assert.equal(err, null, testName + "no error");
            QUnit.assert.equal(bin, JSZipTestUtils.base64encode(opts.rawData), testName + "content ok");
        },
        assert_binarystring : function (opts, err, bin, testName) {
            QUnit.assert.equal(err, null, testName + "no error");
            QUnit.assert.equal(bin, opts.rawData, testName + "content ok");
        },
        assert_array : function (opts, err, array, testName) {
            QUnit.assert.equal(err, null, testName + "no error");
            QUnit.assert.ok(array instanceof Array, testName + "the result is a instance of Array");
            var actual = JSZipTestUtils.toString(array);
            QUnit.assert.equal(actual, opts.rawData, testName + "content ok");
        },
        assert_arraybuffer : function (opts, err, buffer, testName) {
            if (JSZip.support.arraybuffer) {
                QUnit.assert.equal(err, null, testName + "no error");
                QUnit.assert.ok(buffer instanceof ArrayBuffer, testName + "the result is a instance of ArrayBuffer");
                var actual = JSZipTestUtils.toString(buffer);
                QUnit.assert.equal(actual, opts.rawData, testName + "content ok");
            } else {
                QUnit.assert.equal(buffer, null, testName + "no data");
                QUnit.assert.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
            }
        },
        assert_uint8array : function (opts, err, bufferView, testName) {
            if (JSZip.support.uint8array) {
                QUnit.assert.equal(err, null, testName + "no error");
                QUnit.assert.ok(bufferView instanceof Uint8Array, testName+ "the result is a instance of Uint8Array");
                var actual = JSZipTestUtils.toString(bufferView);
                QUnit.assert.equal(actual, opts.rawData, testName + "content ok");
            } else {
                QUnit.assert.equal(bufferView, null, testName + "no data");
                QUnit.assert.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
            }
        },
        assert_nodebuffer : function (opts, err, buffer, testName) {
            if (JSZip.support.nodebuffer) {
                QUnit.assert.equal(err, null, testName + "no error");
                QUnit.assert.ok(buffer instanceof Buffer, testName + "the result is a instance of Buffer");
                var actual = JSZipTestUtils.toString(buffer);
                QUnit.assert.equal(actual, opts.rawData, testName + "content ok");
            } else {
                QUnit.assert.equal(buffer, null, testName + "no data");
                QUnit.assert.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
            }
        },
        assert_blob : function (opts, err, blob, testName) {
            if (JSZip.support.blob) {
                QUnit.assert.equal(err, null, testName + "no error");
                QUnit.assert.ok(blob instanceof Blob, testName + "the result is a instance of Blob");
                QUnit.assert.equal(blob.type,  "", testName + "the result has the right mime type");
                QUnit.assert.equal(blob.size, opts.rawData.length, testName + "the result has the right length");
            } else {
                QUnit.assert.equal(blob, null, testName + "no data");
                QUnit.assert.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
            }
        },
        assert_unknown : function (opts, err, buffer, testName) {
            QUnit.assert.equal(buffer, null, testName + "no data");
            QUnit.assert.ok(err.message.match("not supported by this platform"), testName + "the error message is useful");
        },
        assert_null : function (opts, err, buffer, testName) {
            QUnit.assert.equal(buffer, null, testName + "no data");
            QUnit.assert.ok(err.message.match("No output type specified"), testName + "the error message is useful");
        }
    };

    QUnit.test("add file: file(name, undefined)", function (assert) {
        var zip = new JSZip(), undef;
        zip.file("file.txt", undef);
        testFileDataGetters(assert, {name : "undefined", zip : zip, textData : ""});

        zip = new JSZip();
        zip.file("file.txt", undef, {binary:true});
        testFileDataGetters(assert, {name : "undefined as binary", zip : zip, textData : ""});

        zip = new JSZip();
        zip.file("file.txt", undef, {base64:true});
        testFileDataGetters(assert, {name : "undefined as base64", zip : zip, textData : ""});
    });

    QUnit.test("add file: file(name, null)", function (assert) {
        var zip = new JSZip();
        zip.file("file.txt", null);
        testFileDataGetters(assert, {name : "null", zip : zip, textData : ""});

        zip = new JSZip();
        zip.file("file.txt", null, {binary:true});
        testFileDataGetters(assert, {name : "null as binary", zip : zip, textData : ""});

        zip = new JSZip();
        zip.file("file.txt", null, {base64:true});
        testFileDataGetters(assert, {name : "null as base64", zip : zip, textData : ""});
    });

    QUnit.test("add file: file(name, stringAsText)", function (assert) {
        var zip = new JSZip();
        zip.file("file.txt", "€15\n", {binary:false});
        testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", "test\r\ntest\r\n", {binary:false});
        testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
    });

    QUnit.test("add file: file(name, stringAsBinary)", function (assert) {
        var zip = new JSZip();
        zip.file("file.txt", "\xE2\x82\xAC15\n", {binary:true});
        testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", "test\r\ntest\r\n", {binary:true});
        testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
    });

    QUnit.test("add file: file(name, array)", function (assert) {
        var zip = new JSZip();
        function toArray(str) {
            var array = new Array(str.length);
            for (var i = 0; i < str.length; i++) {
                array[i] = str.charCodeAt(i);
            }
            return array;
        }
        zip.file("file.txt", toArray("\xE2\x82\xAC15\n"), {binary:true});
        testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", toArray("test\r\ntest\r\n"), {binary:true});
        testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
    });

    QUnit.test("add file: file(name, base64)", function (assert) {
        var zip = new JSZip();
        zip.file("file.txt", "4oKsMTUK", {base64:true});
        testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", "dGVzdA0KdGVzdA0K", {base64:true});
        testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});
    });

    QUnit.test("add file: file(name, unsupported)", function (assert) {
        var done = assert.async();
        var zip = new JSZip();
        zip.file("test.txt", new Date());

        zip.file("test.txt")
            .async("string")
        // XXX zip.file(name, data) returns a ZipObject for chaining,
        // we need to try to get the value to get the error
            .then(function () {
                assert.ok(false, "An unsupported object was added, but no exception thrown");
                done();
            }, function (e) {
                assert.ok(e.message.match("Is it in a supported JavaScript type"), "the error message is useful");
                done();
            });
    });

    if (JSZip.support.uint8array) {
        QUnit.test("add file: file(name, Uint8Array)", function (assert) {
            var str2array = function (str) {
                var array = new Uint8Array(str.length);
                for(var i = 0; i < str.length; i++) {
                    array[i] = str.charCodeAt(i);
                }
                return array;
            };
            var zip = new JSZip();
            zip.file("file.txt", str2array("\xE2\x82\xAC15\n"));
            testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2array("test\r\ntest\r\n"));
            testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2array(""));
            testFileDataGetters(assert, {name : "empty content", zip : zip, textData : ""});
        });
    }

    if (JSZip.support.arraybuffer) {
        QUnit.test("add file: file(name, ArrayBuffer)", function (assert) {
            var str2buffer = function (str) {
                var array = new Uint8Array(str.length);
                for(var i = 0; i < str.length; i++) {
                    array[i] = str.charCodeAt(i);
                }
                return array.buffer;
            };
            var zip = new JSZip();
            zip.file("file.txt", str2buffer("\xE2\x82\xAC15\n"));
            testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2buffer("test\r\ntest\r\n"));
            testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2buffer(""));
            testFileDataGetters(assert, {name : "empty content", zip : zip, textData : ""});
        });
    }

    if (JSZip.support.blob) {
        QUnit.test("add file: file(name, Blob)", function (assert) {
            var zip = new JSZip();
            zip.file("file.txt", str2blob("\xE2\x82\xAC15\n"));
            testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2blob("test\r\ntest\r\n"));
            testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2blob(""));
            testFileDataGetters(assert, {name : "empty content", zip : zip, textData : ""});
        });
    }

    if (typeof Promise !== "undefined") {
        QUnit.test("add file: file(name, native Promise)", function (assert) {
            var str2promise = function (str) {
                return new Promise(function(resolve) {
                    setTimeout(function () {
                        resolve(str);
                    }, 10);
                });
            };
            var zip = new JSZip();
            zip.file("file.txt", str2promise("\xE2\x82\xAC15\n"));
            testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2promise("test\r\ntest\r\n"));
            testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2promise(""));
            testFileDataGetters(assert, {name : "empty content", zip : zip, textData : ""});
        });
    }

    QUnit.test("add file: file(name, polyfill Promise[string] as binary)", function (assert) {
        var str2promise = function (str) {
            return new JSZip.external.Promise(function(resolve) {
                setTimeout(function () {
                    resolve(str);
                }, 10);
            });
        };
        var zip = new JSZip();
        zip.file("file.txt", str2promise("\xE2\x82\xAC15\n"), {binary: true});
        testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});
    });

    QUnit.test("add file: file(name, polyfill Promise[string] force text)", function (assert) {
        var str2promise = function (str) {
            return new JSZip.external.Promise(function(resolve) {
                setTimeout(function () {
                    resolve(str);
                }, 10);
            });
        };
        var zip = new JSZip();
        zip.file("file.txt", str2promise("€15\n"), {binary: false});
        testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});
    });

    /*
     * Fix #325 for this one
     *
    QUnit.test("add file: file(name, polyfill Promise[string] as text)", function (assert) {
        var str2promise = function (str) {
            return new JSZip.external.Promise(function(resolve, reject) {
                setTimeout(function () {
                    resolve(str);
                }, 10);
            });
        };
        var zip = new JSZip();
        zip.file("file.txt", str2promise("€15\n"));
        testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

        zip = new JSZip();
        zip.file("file.txt", str2promise("test\r\ntest\r\n"));
        testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

        zip = new JSZip();
        zip.file("file.txt", str2promise(""));
        testFileDataGetters(assert, {name : "empty content", zip : zip, textData : ""});
    });
   */

    if (JSZip.support.blob) {
        QUnit.test("add file: file(name, polyfill Promise[Blob])", function (assert) {
            var str2promiseOfBlob = function (str) {
                return new JSZip.external.Promise(function(resolve) {
                    setTimeout(function () {
                        resolve(str2blob(str));
                    }, 10);
                });
            };
            var zip = new JSZip();
            zip.file("file.txt", str2promiseOfBlob("\xE2\x82\xAC15\n"));
            testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2promiseOfBlob("test\r\ntest\r\n"));
            testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2promiseOfBlob(""));
            testFileDataGetters(assert, {name : "empty content", zip : zip, textData : ""});
        });
    }

    if (JSZip.support.nodebuffer) {
        QUnit.test("add file: file(name, Buffer)", function (assert) {
            var str2buffer = function (str) {
                var array = new Buffer(str.length);
                for(var i = 0; i < str.length; i++) {
                    array[i] = str.charCodeAt(i);
                }
                return array;
            };
            var zip = new JSZip();
            zip.file("file.txt", str2buffer("\xE2\x82\xAC15\n"));
            testFileDataGetters(assert, {name : "utf8", zip : zip, textData : "€15\n", rawData : "\xE2\x82\xAC15\n"});

            zip = new JSZip();
            zip.file("file.txt", str2buffer("test\r\ntest\r\n"));
            testFileDataGetters(assert, {name : "\\r\\n", zip : zip, textData : "test\r\ntest\r\n"});

            zip = new JSZip();
            zip.file("file.txt", str2buffer(""));
            testFileDataGetters(assert, {name : "empty content", zip : zip, textData : ""});
        });
    }


    QUnit.module("about folders");

    QUnit.test("Zip folder() shouldn't throw an exception", function (assert) {
        var zip = new JSZip();
        try {
            zip.folder();
            assert.ok(true, "no exception thrown");
        } catch (e) {
            assert.ok(false, e.message||e);
        }
    });

    JSZipTestUtils.testZipFile("Zip empty folder", "ref/folder.zip", function(assert, expected) {
        var zip = new JSZip();
        zip.folder("folder");
        var done = assert.async();
        zip.generateAsync({type:"binarystring"}).then(function(actual) {
            assert.ok(JSZipTestUtils.similar(actual, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(assert, actual);
            done();
        })["catch"](JSZipTestUtils.assertNoError);
    });

    QUnit.test("file() creates a folder with dir:true", function (assert) {
        var zip = new JSZip();
        zip.file("folder", null, {
            dir : true
        });
        assert.ok(zip.files["folder/"].dir, "the folder with options is marked as a folder");
    });

    QUnit.test("file() creates a folder with the right unix permissions", function (assert) {
        var zip = new JSZip();
        zip.file("folder", null, {
            unixPermissions : parseInt("40500", 8)
        });
        assert.ok(zip.files["folder/"].dir, "the folder with options is marked as a folder");
    });

    QUnit.test("file() creates a folder with the right dos permissions", function (assert) {
        var zip = new JSZip();
        zip.file("folder", null, {
            dosPermissions : parseInt("010000", 2)
        });
        assert.ok(zip.files["folder/"].dir, "the folder with options is marked as a folder");
    });

    QUnit.test("A folder stays a folder when created with file", function (assert) {
        var referenceDate = new Date("July 17, 2009 14:36:56");
        var referenceComment = "my comment";
        var zip = new JSZip();
        zip.file("folder", null, {
            dir : true,
            date : referenceDate,
            comment : referenceComment,
            unixPermissions : parseInt("40500", 8)
        });

        assert.ok(zip.files["folder/"].dir, "the folder with options is marked as a folder");
        assert.equal(zip.files["folder/"].date.getTime(), referenceDate.getTime(), "the folder with options has the correct date");
        assert.equal(zip.files["folder/"].comment, referenceComment, "the folder with options has the correct comment");
        assert.equal(zip.files["folder/"].unixPermissions.toString(8), "40500", "the folder with options has the correct UNIX permissions");

        var done = assert.async();
        zip.generateAsync({type:"string", platform:"UNIX"})
            .then(JSZip.loadAsync)
            .then(function (reloaded) {
                assert.ok(reloaded.files["folder/"].dir, "the folder with options is marked as a folder");

                assert.ok(reloaded.files["folder/"].dir, "the folder with options is marked as a folder");
                assert.equal(reloaded.files["folder/"].date.getTime(), referenceDate.getTime(), "the folder with options has the correct date");
                assert.equal(reloaded.files["folder/"].comment, referenceComment, "the folder with options has the correct comment");
                assert.equal(reloaded.files["folder/"].unixPermissions.toString(8), "40500", "the folder with options has the correct UNIX permissions");
                done();
            })["catch"](JSZipTestUtils.assertNoError);

    });

    QUnit.test("file() adds a slash for directories", function (assert) {
        var zip = new JSZip();
        zip.file("folder_without_slash", null, {
            dir : true
        });
        zip.file("folder_with_slash/", null, {
            dir : true
        });
        assert.ok(zip.files["folder_without_slash/"], "added a slash if not provided");
        assert.ok(zip.files["folder_with_slash/"], "keep the existing slash");
    });

    QUnit.test("folder() doesn't overwrite existing entries", function (assert) {
        var referenceComment = "my comment";
        var zip = new JSZip();
        zip.file("folder", null, {
            dir : true,
            comment : referenceComment,
            unixPermissions : parseInt("40500", 8)
        });

        // calling folder() doesn't override it
        zip.folder("folder");

        assert.equal(zip.files["folder/"].comment, referenceComment, "the folder with options has the correct comment");
        assert.equal(zip.files["folder/"].unixPermissions.toString(8), "40500", "the folder with options has the correct UNIX permissions");
    });

    QUnit.test("createFolders works on a file", function (assert) {
        var zip = new JSZip();
        zip.file("false/0/1/2/file", "content", {createFolders:false, unixPermissions:"644"});
        zip.file("true/0/1/2/file", "content", {createFolders:true, unixPermissions:"644"});

        assert.ok(!zip.files["false/"], "the false/ folder doesn't exist");
        assert.ok(zip.files["true/"], "the true/ folder exists");
        assert.equal(zip.files["true/"].unixPermissions, null, "the options are not propagated");
    });

    QUnit.test("createFolders works on a folder", function (assert) {
        var zip = new JSZip();
        zip.file("false/0/1/2/folder", null, {createFolders:false, unixPermissions:"777",dir:true});
        zip.file("true/0/1/2/folder", null, {createFolders:true, unixPermissions:"777",dir:true});

        assert.ok(!zip.files["false/"], "the false/ folder doesn't exist");
        assert.ok(zip.files["true/"], "the true/ folder exists");
        assert.equal(zip.files["true/"].unixPermissions, null, "the options are not propagated");
    });

    QUnit.test("folder follows the default createFolders settings", function (assert) {
        var zip = new JSZip();
        zip.folder("true/0/1/2/folder");
        assert.ok(zip.files["true/"], "the true/ folder exists");
    });


    QUnit.test("A folder stays a folder", function (assert) {
        var zip = new JSZip();
        zip.folder("folder/");
        assert.ok(zip.files["folder/"].dir, "the folder is marked as a folder");


        var done = assert.async();

        zip.generateAsync({type:"binarystring"})
            .then(JSZip.loadAsync)
            .then(function (reloaded) {
                assert.ok(reloaded.files["folder/"].dir, "the folder is marked as a folder");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    QUnit.test("Folders are created by default", function (assert) {
        var zip = new JSZip();
        zip.file("test/Readme", "Hello World!\n");
        assert.ok(zip.files["test/Readme"], "the file exists");
        assert.ok(zip.files["test/"], "the folder exists");
    });

    QUnit.test("Folders can be avoided with createFolders", function (assert) {
        var zip = new JSZip();
        zip.file("test/Readme", "Hello World!\n", {createFolders: false});
        assert.ok(zip.files["test/Readme"], "the file exists");
        assert.ok(!zip.files["test/"], "the folder doesn't exist");
    });

    QUnit.module("find entries");


    QUnit.test("Finding a file", function(assert) {
        var zip = new JSZip();
        zip.file("Readme", "Hello World!\n");
        zip.file("Readme.French", "Bonjour tout le monde!\n");
        zip.file("Readme.Pirate", "Ahoy m'hearty!\n");

        var done = assert.async();
        zip.file("Readme.French").async("string").then(function (content) {
            assert.equal(content, "Bonjour tout le monde!\n", "Exact match found");
            done();
        })["catch"](JSZipTestUtils.assertNoError);
        assert.equal(zip.file("Readme.Deutsch"), null, "Match exactly nothing");
        assert.equal(zip.file(/Readme\../).length, 2, "Match regex free text");
        assert.equal(zip.file(/pirate/i).length, 1, "Match regex 1 result");
    });

    QUnit.test("Finding a file (text search) with a relative folder", function (assert) {
        var zip = new JSZip();
        zip.folder("files/default").file("Readme", "Hello World!\n");
        zip.folder("files/translation").file("Readme.French", "Bonjour tout le monde!\n");
        zip.folder("files").folder("translation").file("Readme.Pirate", "Ahoy m'hearty!\n");

        var done = assert.async(3);
        zip.file("files/translation/Readme.French").async("string").then(function (content) {
            assert.equal(content, "Bonjour tout le monde!\n", "finding file with the full path");
            done();
        })["catch"](JSZipTestUtils.assertNoError);
        zip.folder("files").file("translation/Readme.French").async("string").then(function (content) {
            assert.equal(content, "Bonjour tout le monde!\n", "finding file with a relative path");
            done();
        })["catch"](JSZipTestUtils.assertNoError);
        zip.folder("files/translation").file("Readme.French").async("string").then(function (content) {
            assert.equal(content, "Bonjour tout le monde!\n", "finding file with a relative path");
            done();
        })["catch"](JSZipTestUtils.assertNoError);
    });

    QUnit.test("Finding files (regex) with a relative folder", function (assert) {
        var zip = new JSZip();
        zip.folder("files/default").file("Readme", "Hello World!\n");
        zip.folder("files/translation").file("Readme.French", "Bonjour tout le monde!\n");
        zip.folder("files").folder("translation").file("Readme.Pirate", "Ahoy m'hearty!\n");

        assert.equal(zip.file(/Readme/).length, 3, "match files in subfolders");
        assert.equal(zip.folder("files/translation").file(/Readme/).length, 2, "regex match only in subfolders");
        assert.equal(zip.folder("files").folder("translation").file(/Readme/).length, 2, "regex match only in subfolders");
        assert.equal(zip.folder("files/translation").file(/pirate/i).length, 1, "regex match only in subfolders");
        assert.equal(zip.folder("files/translation").file(/^readme/i).length, 2, "regex match only with the relative path");
        assert.equal(zip.folder("files/default").file(/pirate/i).length, 0, "regex match only in subfolders");
    });

    QUnit.test("Finding folders", function (assert) {
        var zip = new JSZip();
        zip.folder("root/").folder("sub1/");
        zip.folder("root/sub2/subsub1");

        assert.equal(zip.folder(/sub2\/$/).length, 1, "unique result");
        assert.equal(zip.folder(/sub1/).length, 2, "multiple results");
        assert.equal(zip.folder(/root/).length, 4, "match on whole path");
    });

    QUnit.test("Finding folders with relative path", function (assert) {
        var zip = new JSZip();
        zip.folder("root/").folder("sub1/");
        zip.folder("root/sub2/subsub1");
        var root = zip.folder("root/sub2");

        assert.equal(root.folder(/sub2\/$/).length, 0, "current folder is not matched");
        assert.equal(root.folder(/sub1/).length, 1, "sub folder is matched");
        assert.equal(root.folder(/^subsub1/).length, 1, "relative folder path is used");
        assert.equal(root.folder(/root/).length, 0, "parent folder is not matched");
    });

    function zipObjectsAssertions(assert, zipObject) {
        var date = new Date("July 17, 2009 14:36:57");

        assert.equal(zipObject.name, "Hello.txt", "ZipObject#name is here");

        assert.equal(zipObject.comment, "my comment", "ZipObject#comment is here");

        // the zip date has a 2s resolution
        var delta = Math.abs(zipObject.date.getTime() - date.getTime());
        assert.ok(delta < 2000/* ms */, date, "ZipObject#date is here");
    }
    QUnit.test("ZipObject attributes", function (assert) {
        var date = new Date("July 17, 2009 14:36:57");
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n", {comment:"my comment", date:date});
        zipObjectsAssertions(assert, zip.file("Hello.txt"));
        zipObjectsAssertions(assert, zip.files["Hello.txt"]);
        var done = assert.async();
        zip.generateAsync({type:"binarystring"})
            .then(JSZip.loadAsync)
            .then(function(reloaded) {
                zipObjectsAssertions(assert, reloaded.file("Hello.txt"));
                zipObjectsAssertions(assert, reloaded.files["Hello.txt"]);
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });
    QUnit.test("generate uses updated ZipObject date attribute", function (assert) {
        var date = new Date("July 17, 2009 14:36:57");
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n", {comment:"my comment"}); // date = now
        zip.files["Hello.txt"].date = date;
        var done = assert.async();
        zip.generateAsync({type:"binarystring"})
            .then(JSZip.loadAsync)
            .then(function(reloaded) {
                zipObjectsAssertions(assert, reloaded.file("Hello.txt"));
                zipObjectsAssertions(assert, reloaded.files["Hello.txt"]);
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

});
