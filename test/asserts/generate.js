/* global QUnit,JSZip,JSZipTestUtils */
'use strict';

QUnit.module("generate");

function testGenerateFor(testCases, fn) {
    while(testCases.length) {
        var testCase = testCases.shift();
        fn(testCase.name, testCase.file, testCase.streamFiles);
    }
}

function testGenerate(assert, options) {
    var done = assert.async();
    var triggeredCallback = false;
    new JSZip.external.Promise(function(resolve, reject) {
        resolve(options.prepare());
    })
    .then(function (zip) {
        JSZipTestUtils.checkBasicStreamBehavior(assert, zip.generateInternalStream(options.options));
        return zip;
    })
    .then(function(zip) {
        var promise = zip.generateAsync(options.options);
        zip.file("Hello.txt", "updating the zip file after the call won't change the result");
        return promise;
    })
    .then(function(result) {
        triggeredCallback = true;
        options.assertions(null, result);

        if (!options.skipReloadTest) {
            JSZipTestUtils.checkGenerateStability(assert, result, options.options);
        }
        done();
    }, function (err) {
        triggeredCallback = true;
        options.assertions(err, null);
        done();
    });
    assert.ok(!triggeredCallback, "the async callback is async");
}

testGenerateFor([{
    name : "no stream",
    file : "ref/all.zip",
    streamFiles : false
}, {
    name : "with stream",
    // zip -fd -0 -X -r all-stream.zip Hello.txt images/
    file : "ref/all-stream.zip",
    streamFiles : true
}], function(testName, file, streamFiles) {

    JSZipTestUtils.testZipFile("generate : type:string. " + testName, file, function(assert, expected) {
        testGenerate(assert, {
            prepare : JSZipTestUtils.createZipAll,
            options : {type:"binarystring",streamFiles:streamFiles},
            assertions : function (err, result) {
                assert.equal(err, null, "no error");
                assert.ok(JSZipTestUtils.similar(result, expected, 3 * JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
            }
        });
    });
    JSZipTestUtils.testZipFile("generate : type:base64. " + testName, file, function(assert, expected) {
        testGenerate(assert, {
            prepare : function () {
                // fix date to get a predictable output
                var zip = new JSZip();
                zip.file("Hello.txt", "Hello World\n", {date: new Date(1234567891011)});
                zip.file("images", null, {dir:true, date: new Date(1234876591011)});
                zip.file("images/smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true, date: new Date(1234123491011)});
                return zip;
            },
            skipReloadTest : true,
            options : {type:"base64",streamFiles:streamFiles},
            assertions : function (err, result) {
                assert.equal(err, null, "no error");
                assert.equal(result, JSZipTestUtils.base64encode("all.zip.base64,stream=" + streamFiles), "generated ZIP matches reference ZIP");
            }
        });
    });

    JSZipTestUtils.testZipFile("generate : type:uint8array. " + testName, file, function(assert, expected) {
        testGenerate(assert, {
            prepare : JSZipTestUtils.createZipAll,
            options : {type:"uint8array",streamFiles:streamFiles},
            assertions : function (err, result) {
                if (JSZip.support.uint8array) {
                    assert.equal(err, null, "no error");
                    assert.ok(result instanceof Uint8Array, "the result is a instance of Uint8Array");

                    // var actual = JSZipTestUtils.toString(result);

                    assert.ok(JSZipTestUtils.similar(result, expected, 3 * JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
                } else {
                    assert.equal(result, null, "no data");
                    assert.ok(err.message.match("not supported by this platform"), "the error message is useful");
                }
            }
        });
    });

    JSZipTestUtils.testZipFile("generate : type:arraybuffer. " + testName, file, function(assert, expected) {
        testGenerate(assert, {
            prepare : JSZipTestUtils.createZipAll,
            options : {type:"arraybuffer",streamFiles:streamFiles},
            assertions : function (err, result) {
                if (JSZip.support.arraybuffer) {
                    assert.equal(err, null, "no error");
                    assert.ok(result instanceof ArrayBuffer, "the result is a instance of ArrayBuffer");

                    assert.ok(JSZipTestUtils.similar(result, expected, 3 * JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
                } else {
                    assert.equal(result, null, "no data");
                    assert.ok(err.message.match("not supported by this platform"), "the error message is useful");
                }
            }
        });
    });


    JSZipTestUtils.testZipFile("generate : type:nodebuffer. " + testName, file, function(assert, expected) {
        testGenerate(assert, {
            prepare : JSZipTestUtils.createZipAll,
            options : {type:"nodebuffer",streamFiles:streamFiles},
            assertions : function (err, result) {
                if (JSZip.support.nodebuffer) {
                    assert.equal(err, null, "no error");
                    assert.ok(result instanceof Buffer, "the result is a instance of ArrayBuffer");

                    var actual = JSZipTestUtils.toString(result);

                    assert.ok(JSZipTestUtils.similar(actual, expected, 3 * JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
                } else {
                    assert.equal(result, null, "no data");
                    assert.ok(err.message.match("not supported by this platform"), "the error message is useful");
                }
            }
        });
    });

    JSZipTestUtils.testZipFile("generate : type:blob. " + testName, file, function(assert, expected) {
        testGenerate(assert, {
            prepare : JSZipTestUtils.createZipAll,
            options : {type:"blob",streamFiles:streamFiles},
            skipReloadTest : true,
            assertions : function (err, result) {
                if (JSZip.support.blob) {
                    assert.equal(err, null, "no error");
                    assert.ok(result instanceof Blob, "the result is a instance of Blob");
                    assert.equal(result.type, "application/zip", "the result has the right mime type");
                    assert.equal(result.size, expected.length, "the result has the right length");
                } else {
                    assert.equal(result, null, "no data");
                    assert.ok(err.message.match("not supported by this platform"), "the error message is useful");
                }
            }
        });
    });

    JSZipTestUtils.testZipFile("generate : type:blob mimeType:application/ods. " + testName, file, function(assert, expected) {
        testGenerate(assert, {
            prepare : JSZipTestUtils.createZipAll,
            options : {type:"blob",mimeType: "application/ods",streamFiles:streamFiles},
            skipReloadTest : true,
            assertions : function (err, result) {
                if (JSZip.support.blob) {
                    assert.equal(err, null, "no error");
                    assert.ok(result instanceof Blob, "the result is a instance of Blob");
                    assert.equal(result.type, "application/ods", "the result has the right mime type");
                    assert.equal(result.size, expected.length, "the result has the right length");
                } else {
                    assert.equal(result, null, "no data");
                    assert.ok(err.message.match("not supported by this platform"), "the error message is useful");
                }
            }
        });
    });
});


testGenerateFor([{
    name : "no stream",
    // zip -0 -X store.zip Hello.txt
    file : "ref/store.zip",
    streamFiles : false
}, {
    name : "with stream",
    // zip -0 -X -fd store-stream.zip Hello.txt
    file : "ref/store-stream.zip",
    streamFiles : true
}], function(testName, file, streamFiles) {
    JSZipTestUtils.testZipFile("STORE doesn't compress, " + testName, file, function(assert, expected) {
        testGenerate(assert, {
            prepare : function () {
                var zip = new JSZip();
                zip.file("Hello.txt", "This a looong file : we need to see the difference between the different compression methods.\n");
                return zip;
            },
            options : {type:"binarystring", compression:"STORE",streamFiles:streamFiles},
            assertions : function (err, result) {
                assert.equal(err, null, "no error");
                assert.ok(JSZipTestUtils.similar(result, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
            }
        });
    });
});

testGenerateFor([{
    name : "no stream",
    // zip -6 -X deflate.zip Hello.txt
    file : "ref/deflate.zip",
    streamFiles : false
}, {
    name : "with stream",
    // zip -6 -X -fd deflate-stream.zip Hello.txt
    file : "ref/deflate-stream.zip",
    streamFiles : true
}], function(testName, file, streamFiles) {
    JSZipTestUtils.testZipFile("DEFLATE compress, " + testName, file, function(assert, expected) {
        testGenerate(assert, {
            prepare : function () {
                var zip = new JSZip();
                zip.file("Hello.txt", "This a looong file : we need to see the difference between the different compression methods.\n");
                return zip;
            },
            options : {type:"binarystring", compression:"DEFLATE",streamFiles:streamFiles},
            assertions : function (err, result) {
                assert.equal(err, null, "no error");
                assert.ok(JSZipTestUtils.similar(result, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
            }
        });
    });
});

JSZipTestUtils.testZipFile("STORE is the default method", "ref/text.zip", function(assert, expected) {
    var zip = new JSZip();
    zip.file("Hello.txt", "Hello World\n");
    var done = assert.async();
    zip.generateAsync({type:"binarystring", compression:'STORE'}).then(function(content) {
        // no difference with the "Zip text file" test.
        assert.ok(JSZipTestUtils.similar(content, expected, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});


function testLazyDecompression(assert, from, to) {
    var done = assert.async();
    JSZipTestUtils.createZipAll().generateAsync({type:"binarystring", compression:from}).then(function(actual) {
        done();
        testGenerate(assert, {
            prepare : function () {
                // the zip object will contain compressed objects
                return JSZip.loadAsync(actual);
            },
            skipReloadTest : true,
            options : {type:"binarystring", compression:to},
            assertions : function (err, result) {
                assert.equal(err, null, from + " -> " + to + " : no error");
            }
        });
    })['catch'](JSZipTestUtils.assertNoError);
}
QUnit.test("Lazy decompression works", function(assert) {
    testLazyDecompression(assert, "STORE", "STORE");
    testLazyDecompression(assert, "DEFLATE", "STORE");
    testLazyDecompression(assert, "STORE", "DEFLATE");
    testLazyDecompression(assert, "DEFLATE", "DEFLATE");
});


// zip -0 -X empty.zip plop && zip -d empty.zip plop
JSZipTestUtils.testZipFile("empty zip", "ref/empty.zip", function(assert, expected) {
    testGenerate(assert, {
        prepare : function () {
            var zip = new JSZip();
            return zip;
        },
        options : {type:"binarystring"},
        assertions : function (err, result) {
            assert.equal(err, null, "no error");
            assert.ok(JSZipTestUtils.similar(result, expected, 0 * JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
        }
    });
});

QUnit.test("unknown compression throws an exception", function (assert) {
    testGenerate(assert, {
        prepare : JSZipTestUtils.createZipAll,
        options : {type:"string",compression:'MAYBE'},
        assertions : function (err, result) {
            assert.equal(result, null, "no data");
            assert.ok(err.message.match("not a valid compression"), "the error message is useful");
        }
    });
});

QUnit.test("missing type throws an exception", function (assert) {
    testGenerate(assert, {
        prepare : JSZipTestUtils.createZipAll,
        options : {},
        assertions : function (err, result) {
            assert.equal(result, null, "no data");
            assert.ok(err.message.match("No output type specified."), "the error message is useful");
        }
    });
});

QUnit.test("generateAsync uses the current folder level", function (assert) {
    var done = assert.async();

    var zip = new JSZip();
    zip.file("file1", "a");
    zip.folder("root1");
    zip.folder("root2").file("leaf1", "a");
    zip.folder("root2")
    .generateAsync({type:"string"})
    .then(JSZip.loadAsync)
    .then(function(zip) {
        assert.ok(!zip.file("file1"), "root files are not present");
        assert.ok(!zip.file("root1"), "root folders are not present");
        assert.ok(!zip.file("root2"), "root folders are not present");
        assert.ok(zip.file("leaf1"), "leaves are present");

        done();
    })['catch'](JSZipTestUtils.assertNoError);
});

QUnit.test("generateAsync keep the explicit / folder", function (assert) {
    var done = assert.async();

    var zip = new JSZip();
    zip.file("/file1", "a");
    zip.file("/root1/file2", "b");
    zip.generateAsync({type:"string"})
    .then(JSZip.loadAsync)
    .then(function(zip) {
        assert.ok(zip.file("/file1"), "root files are present");
        assert.ok(zip.file("/root1/file2"), "root folders are present");

        done();
    })['catch'](JSZipTestUtils.assertNoError);
});

JSZipTestUtils.testZipFile("generate with promises as files", "ref/all.zip", function (assert, expected) {
    var done = assert.async();
    var zip = new JSZip();
    zip.file("Hello.txt", new JSZip.external.Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve("Hello World\n");
        }, 50);
    }));
    zip.folder("images").file("smile.gif", new JSZip.external.Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve("R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=");
        }, 100);
    }), {base64: true});

    zip.generateAsync({type:"string"})
    .then(function (result) {
        assert.ok(JSZipTestUtils.similar(result, expected, 3 * JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
        done();
    })['catch'](JSZipTestUtils.assertNoError);
});
