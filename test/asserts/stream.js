/* jshint qunit: true */
/* global JSZip,JSZipTestUtils */
'use strict';

QUnit.module("stream", function () {

    QUnit.module("internal");

    test("A stream is pausable", function () {
        // let's get a stream that generates a lot of chunks
        var zip = new JSZip();
        var txt = "a text";
        for(var i = 0; i < 10; i++) {
            zip.file(i + ".txt", txt);
        }

        var allowChunks = true;
        var chunkCount = 0;

        var helper = zip.generateInternalStream({streamFiles:true, type:"binarystring"});
        helper
        .on("data", function () {
            chunkCount++;
            equal(allowChunks, true, "be sure to get chunks only when allowed");
        })
        .on("error", function (e) {
            start();
            ok(false, e.message);
        })
        .on("end", function () {
            start();
        });
        stop();
        helper.resume();
        setTimeout(function () {
            allowChunks = false;
            ok(chunkCount > 0, "the stream emitted at least 1 chunk before pausing it");
            helper.pause();
        }, 10);
        setTimeout(function () {
            allowChunks = true;
            helper.resume();
        }, 40);


    });

    QUnit.module("nodejs");

    test("TODO", function(){
        ok(false);
    });
});
