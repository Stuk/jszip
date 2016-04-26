/* jshint qunit: true */
/* global JSZip,JSZipTestUtils */
'use strict';

QUnit.module("stream", function () {

    QUnit.module("internal");

    test("A stream is pausable", function (assert) {
        // let's get a stream that generates a lot of chunks (~40)
        var zip = new JSZip();
        var txt = "a text";
        for(var i = 0; i < 10; i++) {
            zip.file(i + ".txt", txt);
        }

        var allowChunks = true;
        var chunkCount = 0;
        var done = assert.async();

        var helper = zip.generateInternalStream({streamFiles:true, type:"binarystring"});
        helper
        .on("data", function () {
            chunkCount++;
            assert.equal(allowChunks, true, "be sure to get chunks only when allowed");

            /*
             * We stop at ~ half of chunks.
             * A setTimeout aside this stream is not reliable and can be
             * triggered *after* the completion of the stream.
             */
            if (chunkCount === 20) {

                allowChunks = false;
                helper.pause();
                setTimeout(function () {
                    allowChunks = true;
                    helper.resume();
                }, 50);
            }
        })
        .on("error", function (e) {
            done();
            assert.ok(false, e.message);
        })
        .on("end", function () {
            done();
        });
        helper.resume();
    });

    QUnit.module("nodejs");
    if (JSZip.support.nodestream) {
        var fs = require('fs');
    }

    function generateStreamTest(name, ref, createFunction, generateOptions, updateStream) {
        JSZipTestUtils.testZipFile(name,ref, function(expected) {
            stop();

            var tempFile = require('tmp').tmpNameSync({postfix:".zip"});

            var zip = createFunction();

            zip.generateNodeStream(generateOptions)
            .pipe(fs.createWriteStream(tempFile))
            .on("close", function () {
                fs.readFile(tempFile, function (e, data) {
                    var actual = JSZipTestUtils.toString(data);
                    ok(JSZipTestUtils.similar(actual, expected, 3 * JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "generated ZIP matches reference ZIP");
                    start();
                    fs.unlink(tempFile);
                });
            })
            .on("error", function (e) {
                ok(false, e.message);
                start();
                fs.unlink(tempFile);
            });
        });
    }
    function zipObjectStreamTest(name, createFunction) {
        test(name, function(assert) {
            var tempFile = require('tmp').tmpNameSync({postfix:".txt"});
            var done = assert.async();
            createFunction().pipe(fs.createWriteStream(tempFile))
            .on("close", function () {
                fs.readFile(tempFile, function (e, data) {
                    var actual = JSZipTestUtils.toString(data);
                    equal(actual, "Hello World\n", "the generated content is ok");
                    done();
                    fs.unlink(tempFile);
                });
            })
            .on("error", function (e) {
                ok(false, e.message);
                done();
                fs.unlink(tempFile);
            });
        });
    }

    if (JSZip.support.nodestream) {

        generateStreamTest(
            "generateNodeStream(type:nodebuffer / !streamFiles) generates a working stream", "ref/all.zip",
            JSZipTestUtils.createZipAll,
            {type:'nodebuffer',streamFiles:false}
        );
        generateStreamTest(
            "generateNodeStream(type:<default> / !streamFiles) generates a working stream", "ref/all.zip",
            JSZipTestUtils.createZipAll,
            {streamFiles:false}
        );
        generateStreamTest(
            "generateNodeStream(<no options>) generates a working stream", "ref/all.zip",
            JSZipTestUtils.createZipAll
        );
        generateStreamTest(
            "generateNodeStream(type:nodebuffer / streamFiles) generates a working stream", "ref/all-stream.zip",
            JSZipTestUtils.createZipAll,
            {type:'nodebuffer',streamFiles:true}
        );
        generateStreamTest(
            "generateNodeStream(type:<default> / streamFiles) generates a working stream", "ref/all-stream.zip",
            JSZipTestUtils.createZipAll,
            {streamFiles:true}
        );

        generateStreamTest(
            "generateNodeStream(type:nodebuffer / !streamFiles) generates a working stream from other streams", "ref/all.zip",
            function () {
                var helloStream = JSZipTestUtils.createZipAll().file("Hello.txt").nodeStream();
                var imgStream = JSZipTestUtils.createZipAll().file("images/smile.gif").nodeStream();
                var zip = new JSZip();
                zip.file("Hello.txt", helloStream);
                zip.folder("images").file("smile.gif", imgStream);

                return zip;
            },
            {type:'nodebuffer',streamFiles:false}
        );
        generateStreamTest(
            "generateNodeStream(type:nodebuffer / streamFiles) generates a working stream from other streams", "ref/all-stream.zip",
            function () {
                var helloStream = JSZipTestUtils.createZipAll().file("Hello.txt").nodeStream();
                var imgStream = JSZipTestUtils.createZipAll().file("images/smile.gif").nodeStream();
                var zip = new JSZip();
                zip.file("Hello.txt", helloStream);
                zip.folder("images").file("smile.gif", imgStream);

                return zip;
            },
            {type:'nodebuffer',streamFiles:true}
        );


        zipObjectStreamTest("ZipObject#nodeStream generates a working stream[nodebuffer]", function() {
            var zip = JSZipTestUtils.createZipAll();
            return zip.file("Hello.txt").nodeStream('nodebuffer');
        });
        zipObjectStreamTest("ZipObject#nodeStream generates a working stream[default]", function() {
            var zip = JSZipTestUtils.createZipAll();
            return zip.file("Hello.txt").nodeStream();
        });

        test("a ZipObject containing a stream can be read with async", function(assert) {
            var done = assert.async();
            var stream = JSZipTestUtils.createZipAll().file("Hello.txt").nodeStream();
            var zip = new JSZip();
            zip.file("Hello.txt", stream);
            zip.file("Hello.txt").async("text").then(function(actual) {
                equal(actual, "Hello World\n", "the stream has been read correctly");
                done();
            })['catch'](JSZipTestUtils.assertNoError);
        });

        test("a ZipObject containing a stream can't be read with async 2 times", function(assert) {
            var done = assert.async();

            var stream = JSZipTestUtils.createZipAll().file("Hello.txt").nodeStream();
            var zip = new JSZip();
            zip.file("Hello.txt", stream);

            // first time, consume the node stream
            zip.file("Hello.txt").async("text");
            // second time, it shouldn't work
            zip.file("Hello.txt").async("text")
            .then(function ok(data) {
                assert.ok(false, "calling 2 times a stream should generate an error");
                done();
            }, function ko(e) {
                assert.ok(e.message.match("has already been used"), "the error message is useful");
                done();
            });
        });

        test("a ZipObject containing a stream can't be read with nodeStream 2 times", function(assert) {
            var done = assert.async();

            var stream = JSZipTestUtils.createZipAll().file("Hello.txt").nodeStream();
            var zip = new JSZip();
            zip.file("Hello.txt", stream);

            // first time, consume the node stream
            zip.file("Hello.txt").nodeStream().resume();
            // second time, it shouldn't work
            zip.file("Hello.txt").nodeStream()
            .on("error", function (e) {
                assert.ok(e.message.match("has already been used"), "the error message is useful");
                done();
            })
            .on ("end", function () {
                assert.ok(false, "calling 2 times a stream should generate an error");
                done();
            })
            .resume();
        });

        test("generateAsync with a stream can't be read 2 times", function(assert) {
            var done = assert.async();

            var stream = JSZipTestUtils.createZipAll().file("Hello.txt").nodeStream();
            var zip = new JSZip();
            zip.file("Hello.txt", stream);

            // first time, consume the node stream
            zip.generateAsync({type:"string"});
            // second time, it shouldn't work
            zip.generateAsync({type:"string"})
            .then(function ok(data) {
                assert.ok(false, "calling 2 times a stream should generate an error");
                done();
            }, function ko(e) {
                assert.ok(e.message.match("has already been used"), "the error message is useful");
                done();
            });
        });

        test("generateNodeStream with a stream can't be read 2 times", function(assert) {
            var done = assert.async();

            var stream = JSZipTestUtils.createZipAll().file("Hello.txt").nodeStream();
            var zip = new JSZip();
            zip.file("Hello.txt", stream);

            // first time, consume the node stream
            zip.generateNodeStream().resume();
            // second time, it shouldn't work
            zip.generateNodeStream()
            .on("error", function (e) {
                assert.ok(e.message.match("has already been used"), "the error message is useful");
                done();
            })
            .on ("end", function () {
                assert.ok(false, "calling 2 times a stream should generate an error");
                done();
            })
            .resume();
        });

        test("loadAsync ends with an error when called with a stream", function(assert) {
            var done = assert.async();
            var stream = JSZipTestUtils.createZipAll().generateNodeStream({"type":"nodebuffer"});
            JSZip.loadAsync(stream).then(function () {
                assert.ok(false, "loading a zip file from a stream is impossible");
                done();
            }, function (e) {
                assert.ok(e.message.match("can't accept a stream when loading"), "the error message is useful");
                done();
            });

        });

    } else {
        test("generateNodeStream generates an error", function(assert) {
            try {
                var zip = new JSZip();
                zip.generateNodeStream({type:'nodebuffer',streamFiles:true});
                assert.ok(false, "generateNodeStream should generate an error");
            } catch(err) {
                assert.ok(err.message.match("not supported by this platform"), "the error message is useful");
            }
        });

        test("ZipObject#nodeStream generates an error", function(assert) {
            try {
                var zip = JSZipTestUtils.createZipAll();
                zip.file("Hello.txt").nodeStream('nodebuffer');
                assert.ok(false, "nodeStream should generate an error");
            } catch(err) {
                assert.ok(err.message.match("not supported by this platform"), "the error message is useful");
            }
        });
    }
});
