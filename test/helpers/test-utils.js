/* global QUnit,JSZip,JSZipTestUtils */
'use strict';

(function (global) {
    // Expose assert object globally
    global.assert = QUnit.assert;

    var JSZipTestUtils = {};

    JSZipTestUtils.similar = function similar(actual, expected, mistakes) {

        if(JSZip.support.arraybuffer) {
            if(actual instanceof ArrayBuffer) {
                actual = new Uint8Array(actual);
            }
            if(expected instanceof ArrayBuffer) {
                expected = new Uint8Array(expected);
            }
        }

        var actualIsString = typeof actual === "string";
        var expectedIsString = typeof expected === "string";

        if (actual.length !== expected.length) {
            mistakes -= Math.abs((actual.length||0) - (expected.length||0));
        }

        for (var i = 0; i < Math.min(actual.length, expected.length); i++) {
            // actual is the generated zip, expected is what we got from the xhr.
            var actualByte = actualIsString ? actual.charCodeAt(i) : actual[i];
            // expected can be a string with char codes > 255, be sure to take only one byte.
            var expectedByte = (expectedIsString ? expected.charCodeAt(i) : expected[i]) & 0xFF;
            if (actualByte !== expectedByte) {
                mistakes--;
            }
        }

        if (mistakes < 0) {
            return false;
        } else {
            return true;
        }
    };

    /*
       Expected differing bytes:
       2  version number
       4  date/time
       4  central dir version numbers
       4  central dir date/time
       4  external file attributes

       18 Total
       */
    JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY = 18;

    JSZipTestUtils.checkGenerateStability = function checkGenerateStability(assert, bytesStream, options) {
        var done = assert.async();

        options = options || {type:"binarystring"};
        // TODO checkcrc32
        return new JSZip().loadAsync(bytesStream).then(function (zip) {
            return zip.generateAsync(options);
        }).then(function (content) {
            assert.ok(JSZipTestUtils.similar(bytesStream, content, 0), "generate stability : stable");
            done();
        })['catch'](JSZipTestUtils.assertNoError);
    };

    JSZipTestUtils.checkBasicStreamBehavior = function checkBasicStreamBehavior(assert, stream, testName) {
        var done = assert.async();
        if (!testName) {
            testName = "";
        }
        var triggeredStream = false;
        stream
        .on("data", function (data, metadata) {
            // triggering a lot of passing checks makes the result unreadable
            if (!data) {
                assert.ok(data, testName + "basic check stream, data event handler, data is defined");
            }
            if(!metadata) {
                assert.ok(metadata, testName + "basic check stream, data event handler, metadata is defined");
            }
            triggeredStream = true;
        })
        .on("error", function (e) {
            assert.ok(e, testName + "basic check stream, error event handler, error is defined");
            triggeredStream = true;
            done();
        })
        .on("end", function () {
            triggeredStream = true;
            done();
        })
        .resume()
        ;
        assert.ok(!triggeredStream, testName + "basic check stream, the stream callback is async");
    };

    JSZipTestUtils.toString = function toString(obj) {
        if(typeof obj === "string" || !obj) {
            return obj;
        }

        if(obj instanceof ArrayBuffer) {
            obj = new Uint8Array(obj);
        }

        var res = "";
        for(var i = 0; i < obj.length; i++) {
            res += String.fromCharCode(obj[i]);
        }
        return res;
    };

    // cache for files
    var refZips = {};

    JSZipTestUtils.fetchFile = function fetchFile(index, url, callback) {
        if(refZips[url]) {
            setTimeout(function () {
                callback(index, null, refZips[url]);
            }, 0);
        } else {
            JSZipTestUtils.loadZipFile(url, function (err, res) {
                var file = JSZipTestUtils.toString(res);
                refZips[url] = file;
                callback(index, err, file);
            });
        }
    };

    JSZipTestUtils.assertNoError = function assertNoError(err) {
        if (typeof console !== "undefined" && console.error) {
            console.error(err.stack);
        }
        QUnit.assert.ok(false, "unexpected error : " + err + ",  " + err.stack);
    };

    JSZipTestUtils.testZipFile = function testZipFile(testName, zipName, testFunction) {
        var simpleForm = !(zipName instanceof Array);
        var filesToFetch = [];
        if(simpleForm) {
            filesToFetch = [zipName];
        } else {
            filesToFetch = zipName;
        }

        QUnit.test(testName, function (assert) {
            var done = assert.async();

            var results = new Array(filesToFetch.length);
            var count = 0;
            var fetchError = null;
            function handleResult(index, err, file) {

                fetchError = fetchError || err;
                results[index] = file;
                count++;

                if (count === filesToFetch.length) {

                    done();
                    if(fetchError) {
                        assert.ok(false, fetchError);
                        return;
                    }
                    if(simpleForm) {
                        testFunction.call(null, assert, results[0]);
                    } else {
                        testFunction.call(null, assert, results);
                    }
                }

            }
            for (var i = 0; i < filesToFetch.length; i++) {
                JSZipTestUtils.fetchFile(i, filesToFetch[i], handleResult);
            }
        });
    };

    JSZipTestUtils.createZipAll = function createZipAll() {
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n");
        zip.folder("images").file("smile.gif", "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=", {base64: true});
        return zip;
    };

    var base64Dict = {
        "": "",
        "\xE2\x82\xAC15\n": "4oKsMTUK",
        "test\r\ntest\r\n": "dGVzdA0KdGVzdA0K",
        "all.zip.base64,stream=false": "UEsDBAoAAAAAAO+7TTrj5ZWwDAAAAAwAAAAJAAAASGVsbG8udHh0SGVsbG8gV29ybGQKUEsDBAoAAAAAAA9qUToAAAAAAAAAAAAAAAAHAAAAaW1hZ2VzL1BLAwQKAAAAAACZoEg6PD/riikAAAApAAAAEAAAAGltYWdlcy9zbWlsZS5naWZHSUY4N2EFAAUAgAIAAAAA/94ALAAAAAAFAAUAAAIIjA+RZ6sKUgEAO1BLAQIUAAoAAAAAAO+7TTrj5ZWwDAAAAAwAAAAJAAAAAAAAAAAAAAAAAAAAAABIZWxsby50eHRQSwECFAAKAAAAAAAPalE6AAAAAAAAAAAAAAAABwAAAAAAAAAAABAAAAAzAAAAaW1hZ2VzL1BLAQIUAAoAAAAAAJmgSDo8P+uKKQAAACkAAAAQAAAAAAAAAAAAAAAAAFgAAABpbWFnZXMvc21pbGUuZ2lmUEsFBgAAAAADAAMAqgAAAK8AAAAAAA==",
        "all.zip.base64,stream=true": "UEsDBAoACAAAAO+7TToAAAAAAAAAAAAAAAAJAAAASGVsbG8udHh0SGVsbG8gV29ybGQKUEsHCOPllbAMAAAADAAAAFBLAwQKAAAAAAAPalE6AAAAAAAAAAAAAAAABwAAAGltYWdlcy9QSwMECgAIAAAAmaBIOgAAAAAAAAAAAAAAABAAAABpbWFnZXMvc21pbGUuZ2lmR0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADtQSwcIPD/riikAAAApAAAAUEsBAhQACgAIAAAA77tNOuPllbAMAAAADAAAAAkAAAAAAAAAAAAAAAAAAAAAAEhlbGxvLnR4dFBLAQIUAAoAAAAAAA9qUToAAAAAAAAAAAAAAAAHAAAAAAAAAAAAEAAAAEMAAABpbWFnZXMvUEsBAhQACgAIAAAAmaBIOjw/64opAAAAKQAAABAAAAAAAAAAAAAAAAAAaAAAAGltYWdlcy9zbWlsZS5naWZQSwUGAAAAAAMAAwCqAAAAzwAAAAAA"
    };
    JSZipTestUtils.base64encode = function(input) {
        if (!(input in base64Dict)){
            throw new Error("unknown key '" + input + "' in the base64 dictionary");
        }
        return base64Dict[input];
    };


    if (global.JSZip) {
        throw new Error("JSZip is already defined, we can't capture the global state *before* its load");
    }

    JSZipTestUtils.oldPromise = global.Promise;

    global.JSZipTestUtils = JSZipTestUtils;
})(typeof window !== "undefined" && window || global);
