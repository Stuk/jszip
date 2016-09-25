/* jshint qunit: true */
/* global JSZip,JSZipTestUtils,BlobBuilder */
'use strict';

QUnit.module("load", function () {


    JSZipTestUtils.testZipFile("load(string) works", "ref/all.zip", function(file) {
        ok(typeof file === "string");
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        })
        .then(function(result) {
            equal(result, "Hello World\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("load(string) handles bytes > 255", "ref/all.zip", function(file) {
        // the method used to load zip with ajax will remove the extra bits.
        // adding extra bits :)
        var updatedFile = "";
        for (var i = 0; i < file.length; i++) {
            updatedFile += String.fromCharCode((file.charCodeAt(i) & 0xff) + 0x4200);
        }

        stop();
        JSZip.loadAsync(updatedFile)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        })
        .then(function (content) {
            equal(content, "Hello World\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });


    JSZipTestUtils.testZipFile("load(Array) works", "ref/deflate.zip", function(file) {
        var updatedFile = new Array(file.length);
        for( var i = 0; i < file.length; ++i ) {
            updatedFile[i] = file.charCodeAt(i);
        }
        stop();
        JSZip.loadAsync(updatedFile)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        })
        .then(function (content) {
            equal(content, "This a looong file : we need to see the difference between the different compression methods.\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("load(array) handles bytes > 255", "ref/deflate.zip", function(file) {
        var updatedFile = new Array(file.length);
        for( var i = 0; i < file.length; ++i ) {
            updatedFile[i] = file.charCodeAt(i) + 0x4200;
        }
        stop();
        JSZip.loadAsync(updatedFile)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        })
        .then(function (content) {
            equal(content, "This a looong file : we need to see the difference between the different compression methods.\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    if (JSZip.support.arraybuffer) {
        JSZipTestUtils.testZipFile("load(ArrayBuffer) works", "ref/all.zip", function(fileAsString) {
            var file = new ArrayBuffer(fileAsString.length);
            var bufferView = new Uint8Array(file);
            for( var i = 0; i < fileAsString.length; ++i ) {
                bufferView[i] = fileAsString.charCodeAt(i);
            }

            ok(file instanceof ArrayBuffer);

            // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
            // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
            stop();
            JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("arraybuffer");
            }).then(function (content){
                equal(content.byteLength, 12, "don't get the original buffer");
                start();
            })['catch'](JSZipTestUtils.assertNoError);

            stop();
            JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("uint8array");
            }).then(function (content){
                equal(content.buffer.byteLength, 12, "don't get a view of the original buffer");
                start();
            });

            stop();
            JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                equal(content, "Hello World\n", "the zip was correctly read.");
                start();
            });
        });
    }

    if (JSZip.support.nodebuffer) {
        JSZipTestUtils.testZipFile("load(Buffer) works", "ref/all.zip", function(fileAsString) {
            var file = new Buffer(fileAsString.length);
            for( var i = 0; i < fileAsString.length; ++i ) {
                file[i] = fileAsString.charCodeAt(i);
            }

            stop();
            JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                equal(content, "Hello World\n", "the zip was correctly read.");
                start();
            });
        });
    }

    if (JSZip.support.uint8array) {
        JSZipTestUtils.testZipFile("load(Uint8Array) works", "ref/all.zip", function(fileAsString) {
            var file = new Uint8Array(fileAsString.length);
            for( var i = 0; i < fileAsString.length; ++i ) {
                file[i] = fileAsString.charCodeAt(i);
            }

            ok(file instanceof Uint8Array);

            // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
            // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
            stop();
            JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("arraybuffer");
            }).then(function (content){
                equal(content.byteLength, 12, "don't get the original buffer");
                start();
            })['catch'](JSZipTestUtils.assertNoError);

            stop();
            JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("uint8array");
            }).then(function (content){
                equal(content.buffer.byteLength, 12, "don't get a view of the original buffer");
                start();
            })['catch'](JSZipTestUtils.assertNoError);

            stop();
            JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                equal(content, "Hello World\n", "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);
        });
    }

    // zip -6 -X deflate.zip Hello.txt
    JSZipTestUtils.testZipFile("zip with DEFLATE", "ref/deflate.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content){
            equal(content, "This a looong file : we need to see the difference between the different compression methods.\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // zip -0 -X -z -c archive_comment.zip Hello.txt
    JSZipTestUtils.testZipFile("read zip with comment", "ref/archive_comment.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            equal(zip.comment, "file comment", "the archive comment was correctly read.");
            equal(zip.file("Hello.txt").comment, "entry comment", "the entry comment was correctly read.");
            return zip.file("Hello.txt").async("string");
        }).then(function (content){
            equal(content, "Hello World\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });
    JSZipTestUtils.testZipFile("generate zip with comment", "ref/archive_comment.zip", function(file) {
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n", {comment:"entry comment"});
        stop();
        zip.generateAsync({type:"binarystring", comment:"file comment"}).then(function(generated) {
            ok(JSZipTestUtils.similar(generated, file, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(generated);
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // zip -0 extra_attributes.zip Hello.txt
    JSZipTestUtils.testZipFile("zip with extra attributes", "ref/extra_attributes.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content){
            equal(content, "Hello World\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // use -fz to force use of Zip64 format
    // zip -fz -0 zip64.zip Hello.txt
    JSZipTestUtils.testZipFile("zip 64", "ref/zip64.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content){
            equal(content, "Hello World\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // use -fd to force data descriptors as if streaming
    // zip -fd -0 data_descriptor.zip Hello.txt
    JSZipTestUtils.testZipFile("zip with data descriptor", "ref/data_descriptor.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content){
            equal(content, "Hello World\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // combo of zip64 and data descriptors :
    // zip -fz -fd -0 data_descriptor_zip64.zip Hello.txt
    // this generate a corrupted zip file :(
    // TODO : find how to get the two features

    // zip -0 -X zip_within_zip.zip Hello.txt && zip -0 -X nested.zip Hello.txt zip_within_zip.zip
    JSZipTestUtils.testZipFile("nested zip", "ref/nested.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("zip_within_zip.zip").async("binarystring");
        })
        .then(JSZip.loadAsync)
        .then(function (innerZip) {
            return innerZip.file("Hello.txt").async("string");
        }).then(function (content) {
            equal(content, "Hello World\n", "the inner zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);

        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content){
            equal(content, "Hello World\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // zip -fd -0 nested_data_descriptor.zip data_descriptor.zip
    JSZipTestUtils.testZipFile("nested zip with data descriptors", "ref/nested_data_descriptor.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("data_descriptor.zip").async("binarystring");
        })
        .then(JSZip.loadAsync)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content) {
            equal(content, "Hello World\n", "the inner zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // zip -fz -0 nested_zip64.zip zip64.zip
    JSZipTestUtils.testZipFile("nested zip 64", "ref/nested_zip64.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("zip64.zip").async("binarystring");
        })
        .then(JSZip.loadAsync)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content) {
            equal(content, "Hello World\n", "the inner zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // nested zip 64 with data descriptors
    // zip -fz -fd -0 nested_data_descriptor_zip64.zip data_descriptor_zip64.zip
    // this generate a corrupted zip file :(
    // TODO : find how to get the two features

    // zip -X -0 utf8_in_name.zip €15.txt
    JSZipTestUtils.testZipFile("Zip text file with UTF-8 characters in filename", "ref/utf8_in_name.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip){
            ok(zip.file("€15.txt") !== null, "the utf8 file is here.");
            return zip.file("€15.txt").async("string");
        })
        .then(function (content) {
            equal(content, "€15\n", "the utf8 content was correctly read (with file().async).");
            start();
        })['catch'](JSZipTestUtils.assertNoError);

        stop();
        JSZip.loadAsync(file)
        .then(function (zip){
            return zip.files["€15.txt"].async("string");
        })
        .then(function (content) {
            equal(content, "€15\n", "the utf8 content was correctly read (with files[].async).");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // Created with winrar
    // winrar will replace the euro symbol with a '_' but set the correct unicode path in an extra field.
    JSZipTestUtils.testZipFile("Zip text file with UTF-8 characters in filename and windows compatibility", "ref/winrar_utf8_in_name.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip){
            ok(zip.file("€15.txt") !== null, "the utf8 file is here.");
            return zip.file("€15.txt").async("string");
        })
        .then(function (content) {
            equal(content, "€15\n", "the utf8 content was correctly read (with file().async).");
            start();
        })['catch'](JSZipTestUtils.assertNoError);

        stop();
        JSZip.loadAsync(file)
        .then(function (zip){
            return zip.files["€15.txt"].async("string");
        })
        .then(function (content) {
            equal(content, "€15\n", "the utf8 content was correctly read (with files[].async).");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // zip backslash.zip -0 -X Hel\\lo.txt
    JSZipTestUtils.testZipFile("Zip text file with backslash in filename", "ref/backslash.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip){
            return zip.file("Hel\\lo.txt").async("string");
        })
        .then(function (content) {
            equal(content, "Hello World\n", "the utf8 content was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // use izarc to generate a zip file on windows
    JSZipTestUtils.testZipFile("Zip text file from windows with \\ in central dir", "ref/slashes_and_izarc.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip){
            return zip.folder("test").file("Hello.txt").async("string");
        })
        .then(function (content) {
            equal(content, "Hello world\r\n", "the content was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // cat Hello.txt all.zip > all_prepended_bytes.zip
    JSZipTestUtils.testZipFile("zip file with prepended bytes", "ref/all_prepended_bytes.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function success(zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content) {
            start();
            equal(content, "Hello World\n", "the zip was correctly read.");
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // cat all.zip Hello.txt > all_appended_bytes.zip
    JSZipTestUtils.testZipFile("zip file with appended bytes", "ref/all_appended_bytes.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function success(zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content) {
            start();
            equal(content, "Hello World\n", "the zip was correctly read.");
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // cat Hello.txt zip64.zip > zip64_prepended_bytes.zip
    JSZipTestUtils.testZipFile("zip64 file with extra bytes", "ref/zip64_prepended_bytes.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function success(zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content) {
            start();
            equal(content, "Hello World\n", "the zip was correctly read.");
        })['catch'](JSZipTestUtils.assertNoError);
    });

    // cat zip64.zip Hello.txt > zip64_appended_bytes.zip
    JSZipTestUtils.testZipFile("zip64 file with extra bytes", "ref/zip64_appended_bytes.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function success(zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content) {
            start();
            equal(content, "Hello World\n", "the zip was correctly read.");
        })['catch'](JSZipTestUtils.assertNoError);
    });

 
    JSZipTestUtils.testZipFile("load(promise) works", "ref/all.zip", function(fileAsString) {
        stop();
        JSZip.loadAsync(JSZip.external.Promise.resolve(fileAsString))
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        }).then(function (content){
            equal(content, "Hello World\n", "the zip was correctly read.");
            start();
        })['catch'](JSZipTestUtils.assertNoError);
    });

    if (JSZip.support.blob) {
        JSZipTestUtils.testZipFile("load(blob) works", "ref/all.zip", function(fileAsString) {
            var u8 = new Uint8Array(fileAsString.length);
            for( var i = 0; i < fileAsString.length; ++i ) {
                u8[i] = fileAsString.charCodeAt(i);
            }
            var file = null;
            try {
                // don't use an Uint8Array, see the comment on utils.newBlob
                file = new Blob([u8.buffer], {type:"application/zip"});
            } catch (e) {
                var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
                var builder = new Builder();
                builder.append(u8.buffer);
                file = builder.getBlob("application/zip");
            }

            stop();
            JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                equal(content, "Hello World\n", "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);
        });
    }

    JSZipTestUtils.testZipFile("valid crc32", "ref/all.zip", function(file) {
        stop();
        JSZip.loadAsync(file, {checkCRC32:true})
        .then(function success() {
            start();
            ok(true, "no exception were thrown");
        }, function failure(e) {
            start();
            ok(false, "An exception were thrown: " + e.message);
        });
    });

    QUnit.module("not supported features");

    // zip -0 -X -e encrypted.zip Hello.txt
    JSZipTestUtils.testZipFile("basic encryption", "ref/encrypted.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function success() {
            start();
            ok(false, "Encryption is not supported, but no exception were thrown");
        }, function failure(e) {
            start();
            equal(e.message, "Encrypted zip are not supported", "the error message is useful");
        });
    });

    QUnit.module("corrupted zip");

    JSZipTestUtils.testZipFile("bad compression method", "ref/invalid/compression.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function success() {
            start();
            ok(false, "no exception were thrown");
        }, function failure(e) {
            start();
            ok(e.message.match("Corrupted zip"), "the error message is useful");
        });
    });

    // dd if=all.zip of=all_missing_bytes.zip bs=32 skip=1
    JSZipTestUtils.testZipFile("zip file with missing bytes", "ref/all_missing_bytes.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function success() {
            start();
            ok(false, "no exception were thrown");
        }, function failure(e) {
            start();
            ok(e.message.match("Corrupted zip"), "the error message is useful");
        });
    });

    // dd if=zip64.zip of=zip64_missing_bytes.zip bs=32 skip=1
    JSZipTestUtils.testZipFile("zip64 file with missing bytes", "ref/zip64_missing_bytes.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function success() {
            start();
            ok(false, "no exception were thrown");
        }, function failure(e) {
            start();
            ok(e.message.match("Corrupted zip"), "the error message is useful");
        });
    });

    test("not a zip file", function() {
        stop();
        JSZip.loadAsync("this is not a zip file")
        .then(function success() {
            start();
            ok(false, "no exception were thrown");
        }, function failure(e) {
            start();
            ok(e.message.match("stuk.github.io/jszip/documentation"), "the error message is useful");
        });
    });

    test("truncated zip file", function() {
        stop();
        JSZip.loadAsync("PK\x03\x04\x0A\x00\x00\x00<cut>")
        .then(function success() {
            start();
            ok(false, "no exception were thrown");
        }, function failure(e) {
            start();
            ok(e.message.match("Corrupted zip"), "the error message is useful");
        });
    });

    JSZipTestUtils.testZipFile("invalid crc32 but no check", "ref/invalid/crc32.zip", function(file) {
        stop();
        JSZip.loadAsync(file, {checkCRC32:false})
        .then(function success() {
            start();
            ok(true, "no exception were thrown");
        }, function failure(e) {
            start();
            ok(false, "An exception were thrown but the check should have been disabled.");
        });
    });

    JSZipTestUtils.testZipFile("invalid crc32", "ref/invalid/crc32.zip", function(file) {
        stop();
        JSZip.loadAsync(file, {checkCRC32:true})
        .then(function success() {
            start();
            ok(false, "no exception were thrown");
        }, function failure(e) {
            start();
            ok(e.message.match("Corrupted zip"), "the error message is useful");
        });
    });

    JSZipTestUtils.testZipFile("bad offset", "ref/invalid/bad_offset.zip", function(file) {
        stop();
        JSZip.loadAsync(file, {checkCRC32:false})
        .then(function success() {
            start();
            ok(false, "no exception were thrown");
        }, function failure(e) {
            start();
            ok(e.message.match("Corrupted zip"), "the error message is useful");
        });
    });

    JSZipTestUtils.testZipFile("bad decompressed size, read a file", "ref/invalid/bad_decompressed_size.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {
            return zip.file("Hello.txt").async("string");
        })
        .then(function success() {
            ok(false, "successful result in an error test");
            start();
        }, function failure(e) {
            ok(e.message.match("size mismatch"), "async call : the error message is useful");
            start();
        });
    });

    JSZipTestUtils.testZipFile("bad decompressed size, generate a zip", "ref/invalid/bad_decompressed_size.zip", function(file) {
        stop();
        JSZip.loadAsync(file)
        .then(function (zip) {

            // add other files to be sure to trigger the right code path
            zip.file("zz", "zz");

            return zip.generateAsync({
                type:"string",
                compression:"DEFLATE" // a different compression to force a read
            });
        })
        .then(function success() {
            ok(false, "successful result in an error test");
            start();
        }, function failure(e) {
            ok(e.message.match("size mismatch"), "async call : the error message is useful");
            start();
        });
    });

    QUnit.module("complex files");

    if (typeof window === "undefined" || QUnit.urlParams.complexfiles) {

        // http://www.feedbooks.com/book/8/the-metamorphosis
        JSZipTestUtils.testZipFile("Franz Kafka - The Metamorphosis.epub", "ref/complex_files/Franz Kafka - The Metamorphosis.epub", function(file) {
            stop();
            JSZip.loadAsync(file)
            .then(function(zip) {
                equal(zip.filter(function(){return true;}).length, 26, "the zip contains the good number of elements.");
                return zip.file("mimetype").async("string");
            })
            .then(function (content) {
                equal(content, "application/epub+zip\r\n", "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);

            stop();
            JSZip.loadAsync(file)
            .then(function(zip) {
                return zip.file("OPS/main0.xml").async("string");
            })
            .then(function (content) {
                // the .ncx file tells us that the first chapter is in the main0.xml file.
                ok(content.indexOf("One morning, as Gregor Samsa was waking up from anxious dreams") !== -1, "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);
        });

        // a showcase in http://msdn.microsoft.com/en-us/windows/hardware/gg463429
        JSZipTestUtils.testZipFile("Outlook2007_Calendar.xps, createFolders: false", "ref/complex_files/Outlook2007_Calendar.xps", function(file) {

            stop();
            JSZip.loadAsync(file, {createFolders: false})
            .then(function(zip) {
                // the zip file contains 15 entries.
                equal(zip.filter(function(){return true;}).length, 15, "the zip contains the good number of elements.");
                return zip.file("[Content_Types].xml").async("string");
            })
            .then(function (content) {
                ok(content.indexOf("application/vnd.ms-package.xps-fixeddocument+xml") !== -1, "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);
        });

        // Same test as above, but with createFolders option set to true
        JSZipTestUtils.testZipFile("Outlook2007_Calendar.xps, createFolders: true", "ref/complex_files/Outlook2007_Calendar.xps", function(file) {
            stop();
            JSZip.loadAsync(file, {createFolders: true})
            .then(function(zip) {
                // the zip file contains 15 entries, but we get 23 when creating all the sub-folders.
                equal(zip.filter(function(){return true;}).length, 23, "the zip contains the good number of elements.");
                return zip.file("[Content_Types].xml").async("string");
            })
            .then(function (content) {
                ok(content.indexOf("application/vnd.ms-package.xps-fixeddocument+xml") !== -1, "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);
        });

        // an example file in http://cheeso.members.winisp.net/srcview.aspx?dir=js-unzip
        // the data come from http://www.antarctica.ac.uk/met/READER/upper_air/
        JSZipTestUtils.testZipFile("AntarcticaTemps.xlsx, createFolders: false", "ref/complex_files/AntarcticaTemps.xlsx", function(file) {
            stop();
            JSZip.loadAsync(file, {createFolders: false})
            .then(function(zip) {
                // the zip file contains 17 entries.
                equal(zip.filter(function(){return true;}).length, 17, "the zip contains the good number of elements.");
                return zip.file("[Content_Types].xml").async("string");
            }).then(function (content) {
                ok(content.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml") !== -1, "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);
        });

        // Same test as above, but with createFolders option set to true
        JSZipTestUtils.testZipFile("AntarcticaTemps.xlsx, createFolders: true", "ref/complex_files/AntarcticaTemps.xlsx", function(file) {
            stop();
            JSZip.loadAsync(file, {createFolders: true})
            .then(function(zip) {
                // the zip file contains 16 entries, but we get 27 when creating all the sub-folders.
                equal(zip.filter(function(){return true;}).length, 27, "the zip contains the good number of elements.");
                return zip.file("[Content_Types].xml").async("string");
            }).then(function (content) {
                ok(content.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml") !== -1, "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);
        });

        // same as two up, but in the Open Document format
        JSZipTestUtils.testZipFile("AntarcticaTemps.ods, createFolders: false", "ref/complex_files/AntarcticaTemps.ods", function (file) {
            stop();
            JSZip.loadAsync(file, {createFolders: false})
            .then(function(zip) {
                // the zip file contains 20 entries.
                equal(zip.filter(function () {return true;}).length, 20, "the zip contains the good number of elements.");
                return zip.file("META-INF/manifest.xml").async("string");
            })
            .then(function (content) {
                ok(content.indexOf("application/vnd.oasis.opendocument.spreadsheet") !== -1, "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);
        });

        // same as above, but in the Open Document format
        JSZipTestUtils.testZipFile("AntarcticaTemps.ods, createFolders: true", "ref/complex_files/AntarcticaTemps.ods", function (file) {
            stop();
            JSZip.loadAsync(file, {createFolders: true})
            .then(function(zip) {
                // the zip file contains 19 entries, but we get 27 when creating all the sub-folders.
                equal(zip.filter(function () {return true;}).length, 27, "the zip contains the good number of elements.");
                return zip.file("META-INF/manifest.xml").async("string");
            })
            .then(function (content) {
                ok(content.indexOf("application/vnd.oasis.opendocument.spreadsheet") !== -1, "the zip was correctly read.");
                start();
            })['catch'](JSZipTestUtils.assertNoError);
        });
    }
});
