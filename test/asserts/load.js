"use strict";

QUnit.module("load", function () {


    JSZipTestUtils.testZipFile("load(string) works", "ref/all.zip", function(assert, file) {
        var done = assert.async();
        assert.ok(typeof file === "string");
        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            })
            .then(function(result) {
                assert.equal(result, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("Load files which shadow Object prototype methods", "ref/pollution.zip", function(assert, file) {
        var done = assert.async();
        assert.ok(typeof file === "string");
        JSZip.loadAsync(file)
            .then(function (zip) {
                assert.notEqual(Object.getPrototypeOf(zip.files), zip.files.__proto__);
                return zip.file("__proto__").async("string");        })
            .then(function(result) {
                assert.equal(result, "hello\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("load(string) handles bytes > 255", "ref/all.zip", function(assert, file) {
        var done = assert.async();
        // the method used to load zip with ajax will remove the extra bits.
        // adding extra bits :)
        var updatedFile = "";
        for (var i = 0; i < file.length; i++) {
            updatedFile += String.fromCharCode((file.charCodeAt(i) & 0xff) + 0x4200);
        }

        JSZip.loadAsync(updatedFile)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            })
            .then(function (content) {
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });


    JSZipTestUtils.testZipFile("load(Array) works", "ref/deflate.zip", function(assert, file) {
        var done = assert.async();
        var updatedFile = new Array(file.length);
        for( var i = 0; i < file.length; ++i ) {
            updatedFile[i] = file.charCodeAt(i);
        }
        JSZip.loadAsync(updatedFile)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            })
            .then(function (content) {
                assert.equal(content, "This a looong file : we need to see the difference between the different compression methods.\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    JSZipTestUtils.testZipFile("load(array) handles bytes > 255", "ref/deflate.zip", function(assert, file) {
        var done = assert.async();
        var updatedFile = new Array(file.length);
        for( var i = 0; i < file.length; ++i ) {
            updatedFile[i] = file.charCodeAt(i) + 0x4200;
        }
        JSZip.loadAsync(updatedFile)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            })
            .then(function (content) {
                assert.equal(content, "This a looong file : we need to see the difference between the different compression methods.\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    if (JSZip.support.arraybuffer) {
        JSZipTestUtils.testZipFile("load(ArrayBuffer) works", "ref/all.zip", function(assert, fileAsString) {
            var done = assert.async(3);
            var file = new ArrayBuffer(fileAsString.length);
            var bufferView = new Uint8Array(file);
            for( var i = 0; i < fileAsString.length; ++i ) {
                bufferView[i] = fileAsString.charCodeAt(i);
            }

            assert.ok(file instanceof ArrayBuffer);

            // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
            // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
            JSZip.loadAsync(file)
                .then(function (zip) {
                    return zip.file("Hello.txt").async("arraybuffer");
                }).then(function (content){
                    assert.equal(content.byteLength, 12, "don't get the original buffer");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);

            JSZip.loadAsync(file)
                .then(function (zip) {
                    return zip.file("Hello.txt").async("uint8array");
                }).then(function (content){
                    assert.equal(content.buffer.byteLength, 12, "don't get a view of the original buffer");
                    done();
                });

            JSZip.loadAsync(file)
                .then(function (zip) {
                    return zip.file("Hello.txt").async("string");
                }).then(function (content){
                    assert.equal(content, "Hello World\n", "the zip was correctly read.");
                    done();
                });
        });
    }

    if (JSZip.support.nodebuffer) {
        JSZipTestUtils.testZipFile("load(Buffer) works", "ref/all.zip", function(assert, fileAsString) {
            var done = assert.async();
            var file = new Buffer(fileAsString.length);
            for( var i = 0; i < fileAsString.length; ++i ) {
                file[i] = fileAsString.charCodeAt(i);
            }

            JSZip.loadAsync(file)
                .then(function (zip) {
                    return zip.file("Hello.txt").async("string");
                }).then(function (content){
                    assert.equal(content, "Hello World\n", "the zip was correctly read.");
                    done();
                });
        });
    }

    if (JSZip.support.uint8array) {
        JSZipTestUtils.testZipFile("load(Uint8Array) works", "ref/all.zip", function(assert, fileAsString) {
            var done = assert.async(3);
            var file = new Uint8Array(fileAsString.length);
            for( var i = 0; i < fileAsString.length; ++i ) {
                file[i] = fileAsString.charCodeAt(i);
            }

            assert.ok(file instanceof Uint8Array);

            // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
            // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
            JSZip.loadAsync(file)
                .then(function (zip) {
                    return zip.file("Hello.txt").async("arraybuffer");
                }).then(function (content){
                    assert.equal(content.byteLength, 12, "don't get the original buffer");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);

            JSZip.loadAsync(file)
                .then(function (zip) {
                    return zip.file("Hello.txt").async("uint8array");
                }).then(function (content){
                    assert.equal(content.buffer.byteLength, 12, "don't get a view of the original buffer");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);

            JSZip.loadAsync(file)
                .then(function (zip) {
                    return zip.file("Hello.txt").async("string");
                }).then(function (content){
                    assert.equal(content, "Hello World\n", "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);
        });
    }

    // zip -6 -X deflate.zip Hello.txt
    JSZipTestUtils.testZipFile("zip with DEFLATE", "ref/deflate.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                assert.equal(content, "This a looong file : we need to see the difference between the different compression methods.\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // zip -0 -X -z -c archive_comment.zip Hello.txt
    JSZipTestUtils.testZipFile("read zip with comment", "ref/archive_comment.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip) {
                assert.equal(zip.comment, "file comment", "the archive comment was correctly read.");
                assert.equal(zip.file("Hello.txt").comment, "entry comment", "the entry comment was correctly read.");
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });
    JSZipTestUtils.testZipFile("generate zip with comment", "ref/archive_comment.zip", function(assert, file) {
        var zip = new JSZip();
        zip.file("Hello.txt", "Hello World\n", {comment:"entry comment"});
        var done = assert.async();
        zip.generateAsync({type:"binarystring", comment:"file comment"}).then(function(generated) {
            assert.ok(JSZipTestUtils.similar(generated, file, JSZipTestUtils.MAX_BYTES_DIFFERENCE_PER_ZIP_ENTRY) , "Generated ZIP matches reference ZIP");
            JSZipTestUtils.checkGenerateStability(assert, generated);
            done();
        })["catch"](JSZipTestUtils.assertNoError);
    });

    // zip -0 extra_attributes.zip Hello.txt
    JSZipTestUtils.testZipFile("zip with extra attributes", "ref/extra_attributes.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // use -fz to force use of Zip64 format
    // zip -fz -0 zip64.zip Hello.txt
    JSZipTestUtils.testZipFile("zip 64", "ref/zip64.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // use -fd to force data descriptors as if streaming
    // zip -fd -0 data_descriptor.zip Hello.txt
    JSZipTestUtils.testZipFile("zip with data descriptor", "ref/data_descriptor.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // combo of zip64 and data descriptors :
    // zip -fz -fd -0 data_descriptor_zip64.zip Hello.txt
    // this generate a corrupted zip file :(
    // TODO : find how to get the two features

    // zip -0 -X zip_within_zip.zip Hello.txt && zip -0 -X nested.zip Hello.txt zip_within_zip.zip
    JSZipTestUtils.testZipFile("nested zip", "ref/nested.zip", function(assert, file) {
        var done = assert.async(2);
        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("zip_within_zip.zip").async("binarystring");
            })
            .then(JSZip.loadAsync)
            .then(function (innerZip) {
                return innerZip.file("Hello.txt").async("string");
            }).then(function (content) {
                assert.equal(content, "Hello World\n", "the inner zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);

        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // zip -fd -0 nested_data_descriptor.zip data_descriptor.zip
    JSZipTestUtils.testZipFile("nested zip with data descriptors", "ref/nested_data_descriptor.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("data_descriptor.zip").async("binarystring");
            })
            .then(JSZip.loadAsync)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content) {
                assert.equal(content, "Hello World\n", "the inner zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // zip -fz -0 nested_zip64.zip zip64.zip
    JSZipTestUtils.testZipFile("nested zip 64", "ref/nested_zip64.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("zip64.zip").async("binarystring");
            })
            .then(JSZip.loadAsync)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content) {
                assert.equal(content, "Hello World\n", "the inner zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // nested zip 64 with data descriptors
    // zip -fz -fd -0 nested_data_descriptor_zip64.zip data_descriptor_zip64.zip
    // this generate a corrupted zip file :(
    // TODO : find how to get the two features

    // zip -X -0 utf8_in_name.zip €15.txt
    JSZipTestUtils.testZipFile("Zip text file with UTF-8 characters in filename", "ref/utf8_in_name.zip", function(assert, file) {
        var done = assert.async(2);
        JSZip.loadAsync(file)
            .then(function (zip){
                assert.ok(zip.file("€15.txt") !== null, "the utf8 file is here.");
                return zip.file("€15.txt").async("string");
            })
            .then(function (content) {
                assert.equal(content, "€15\n", "the utf8 content was correctly read (with file().async).");
                done();
            })["catch"](JSZipTestUtils.assertNoError);

        JSZip.loadAsync(file)
            .then(function (zip){
                return zip.files["€15.txt"].async("string");
            })
            .then(function (content) {
                assert.equal(content, "€15\n", "the utf8 content was correctly read (with files[].async).");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // Created with winrar
    // winrar will replace the euro symbol with a '_' but set the correct unicode path in an extra field.
    JSZipTestUtils.testZipFile("Zip text file with UTF-8 characters in filename and windows compatibility", "ref/winrar_utf8_in_name.zip", function(assert, file) {
        var done = assert.async(2);
        JSZip.loadAsync(file)
            .then(function (zip){
                assert.ok(zip.file("€15.txt") !== null, "the utf8 file is here.");
                return zip.file("€15.txt").async("string");
            })
            .then(function (content) {
                assert.equal(content, "€15\n", "the utf8 content was correctly read (with file().async).");
                done();
            })["catch"](JSZipTestUtils.assertNoError);

        JSZip.loadAsync(file)
            .then(function (zip){
                return zip.files["€15.txt"].async("string");
            })
            .then(function (content) {
                assert.equal(content, "€15\n", "the utf8 content was correctly read (with files[].async).");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // zip backslash.zip -0 -X Hel\\lo.txt
    JSZipTestUtils.testZipFile("Zip text file with backslash in filename", "ref/backslash.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip){
                return zip.file("Hel\\lo.txt").async("string");
            })
            .then(function (content) {
                assert.equal(content, "Hello World\n", "the utf8 content was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // use izarc to generate a zip file on windows
    JSZipTestUtils.testZipFile("Zip text file from windows with \\ in central dir", "ref/slashes_and_izarc.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip){
                return zip.folder("test").file("Hello.txt").async("string");
            })
            .then(function (content) {
                assert.equal(content, "Hello world\r\n", "the content was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // cat Hello.txt all.zip > all_prepended_bytes.zip
    JSZipTestUtils.testZipFile("zip file with prepended bytes", "ref/all_prepended_bytes.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function success(zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content) {
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // cat all.zip Hello.txt > all_appended_bytes.zip
    JSZipTestUtils.testZipFile("zip file with appended bytes", "ref/all_appended_bytes.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function success(zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content) {
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // cat Hello.txt zip64.zip > zip64_prepended_bytes.zip
    JSZipTestUtils.testZipFile("zip64 file with extra bytes", "ref/zip64_prepended_bytes.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function success(zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content) {
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    // cat zip64.zip Hello.txt > zip64_appended_bytes.zip
    JSZipTestUtils.testZipFile("zip64 file with extra bytes", "ref/zip64_appended_bytes.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function success(zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content) {
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });


    JSZipTestUtils.testZipFile("load(promise) works", "ref/all.zip", function(assert, fileAsString) {
        var done = assert.async();
        JSZip.loadAsync(JSZip.external.Promise.resolve(fileAsString))
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            }).then(function (content){
                assert.equal(content, "Hello World\n", "the zip was correctly read.");
                done();
            })["catch"](JSZipTestUtils.assertNoError);
    });

    if (JSZip.support.blob) {
        JSZipTestUtils.testZipFile("load(blob) works", "ref/all.zip", function(assert, fileAsString) {
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

            var done = assert.async();
            JSZip.loadAsync(file)
                .then(function (zip) {
                    return zip.file("Hello.txt").async("string");
                }).then(function (content){
                    assert.equal(content, "Hello World\n", "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);
        });
    }

    JSZipTestUtils.testZipFile("valid crc32", "ref/all.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file, {checkCRC32:true})
            .then(function success() {
                assert.ok(true, "no exception were thrown");
                done();
            }, function failure(e) {
                assert.ok(false, "An exception were thrown: " + e.message);
                done();
            });
    });

    JSZipTestUtils.testZipFile("loading in a sub folder", "ref/all.zip", function(assert, file) {
        var done = assert.async();
        var zip = new JSZip();
        zip.folder("sub").loadAsync(file)
            .then(function success(zip) {
                assert.ok(zip.file("Hello.txt"), "the zip was correctly read.");
                assert.equal(zip.file("Hello.txt").name, "sub/Hello.txt", "the zip was read in a sub folder");
                assert.equal(zip.root, "sub/", "the promise contains the correct folder level");
                done();
            }, function failure(e) {
                assert.ok(false, "An exception were thrown: " + e.message);
                done();
            });
    });

    JSZipTestUtils.testZipFile("loading overwrite files", "ref/all.zip", function(assert, file) {
        var done = assert.async();
        var zip = new JSZip();
        zip.file("Hello.txt", "bonjour à tous");
        zip.file("Bye.txt", "au revoir");
        zip.loadAsync(file)
            .then(function success(zip) {
                return JSZip.external.Promise.all([
                    zip.file("Hello.txt").async("text"),
                    zip.file("Bye.txt").async("text")
                ]);
            }).then(function (result) {
                var hello = result[0];
                var bye = result[1];
                assert.equal(hello, "Hello World\n", "conflicting content was overwritten.");
                assert.equal(bye, "au revoir", "other content was kept.");
                done();
            }, function failure(e) {
                assert.ok(false, "An exception were thrown: " + e.message);
                done();
            });
    });

    QUnit.module("not supported features");

    // zip -0 -X -e encrypted.zip Hello.txt
    JSZipTestUtils.testZipFile("basic encryption", "ref/encrypted.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function success() {
                assert.ok(false, "Encryption is not supported, but no exception were thrown");
                done();
            }, function failure(e) {
                assert.equal(e.message, "Encrypted zip are not supported", "the error message is useful");
                done();
            });
    });

    QUnit.module("corrupted zip");

    JSZipTestUtils.testZipFile("bad compression method", "ref/invalid/compression.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function success() {
                assert.ok(false, "no exception were thrown");
                done();
            }, function failure(e) {
                assert.ok(e.message.match("Corrupted zip"), "the error message is useful");
                done();
            });
    });

    // dd if=all.zip of=all_missing_bytes.zip bs=32 skip=1
    JSZipTestUtils.testZipFile("zip file with missing bytes", "ref/all_missing_bytes.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function success() {
                assert.ok(false, "no exception were thrown");
                done();
            }, function failure(e) {
                assert.ok(e.message.match("Corrupted zip"), "the error message is useful");
                done();
            });
    });

    // dd if=zip64.zip of=zip64_missing_bytes.zip bs=32 skip=1
    JSZipTestUtils.testZipFile("zip64 file with missing bytes", "ref/zip64_missing_bytes.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function success() {
                assert.ok(false, "no exception were thrown");
                done();
            }, function failure(e) {
                assert.ok(e.message.match("Corrupted zip"), "the error message is useful");
                done();
            });
    });

    JSZipTestUtils.testZipFile("zip file with extra field is Non-standard", "ref/extra_filed_non_standard.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function success() {
                assert.ok(true, "no exception were thrown");
                done();
            }, function failure(e) {
                assert.ok(false, "An exception were thrown: " + e.message);
                done();
            });
    });

    QUnit.test("not a zip file", function(assert) {
        var done = assert.async();
        JSZip.loadAsync("this is not a zip file")
            .then(function success() {
                assert.ok(false, "no exception were thrown");
                done();
            }, function failure(e) {
                assert.ok(e.message.match("stuk.github.io/jszip/documentation"), "the error message is useful");
                done();
            });
    });

    QUnit.test("truncated zip file", function(assert) {
        var done = assert.async();
        JSZip.loadAsync("PK\x03\x04\x0A\x00\x00\x00<cut>")
            .then(function success() {
                done();
                assert.ok(false, "no exception were thrown");
            }, function failure(e) {
                assert.ok(e.message.match("Corrupted zip"), "the error message is useful");
                done();
            });
    });

    JSZipTestUtils.testZipFile("invalid crc32 but no check", "ref/invalid/crc32.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file, {checkCRC32:false})
            .then(function success() {
                assert.ok(true, "no exception were thrown");
                done();
            }, function failure() {
                assert.ok(false, "An exception were thrown but the check should have been disabled.");
                done();
            });
    });

    JSZipTestUtils.testZipFile("invalid crc32", "ref/invalid/crc32.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file, {checkCRC32:true})
            .then(function success() {
                assert.ok(false, "no exception were thrown");
                done();
            }, function failure(e) {
                assert.ok(e.message.match("Corrupted zip"), "the error message is useful");
                done();
            });
    });

    JSZipTestUtils.testZipFile("bad offset", "ref/invalid/bad_offset.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file, {checkCRC32:false})
            .then(function success() {
                assert.ok(false, "no exception were thrown");
                done();
            }, function failure(e) {
                assert.ok(e.message.match("Corrupted zip"), "the error message is useful");
                done();
            });
    });

    JSZipTestUtils.testZipFile("bad decompressed size, read a file", "ref/invalid/bad_decompressed_size.zip", function(assert, file) {
        var done = assert.async();
        JSZip.loadAsync(file)
            .then(function (zip) {
                return zip.file("Hello.txt").async("string");
            })
            .then(function success() {
                assert.ok(false, "successful result in an error test");
                done();
            }, function failure(e) {
                assert.ok(e.message.match("size mismatch"), "async call : the error message is useful");
                done();
            });
    });

    JSZipTestUtils.testZipFile("bad decompressed size, generate a zip", "ref/invalid/bad_decompressed_size.zip", function(assert, file) {
        var done = assert.async();
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
                assert.ok(false, "successful result in an error test");
                done();
            }, function failure(e) {
                assert.ok(e.message.match("size mismatch"), "async call : the error message is useful");
                done();
            });
    });

    QUnit.module("complex files");

    if (typeof window === "undefined" || QUnit.urlParams.complexfiles) {

        // http://www.feedbooks.com/book/8/the-metamorphosis
        JSZipTestUtils.testZipFile("Franz Kafka - The Metamorphosis.epub", "ref/complex_files/Franz Kafka - The Metamorphosis.epub", function(assert, file) {
            var done = assert.async(2);
            JSZip.loadAsync(file)
                .then(function(zip) {
                    assert.equal(zip.filter(function(){return true;}).length, 26, "the zip contains the good number of elements.");
                    return zip.file("mimetype").async("string");
                })
                .then(function (content) {
                    assert.equal(content, "application/epub+zip\r\n", "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);

            JSZip.loadAsync(file)
                .then(function(zip) {
                    return zip.file("OPS/main0.xml").async("string");
                })
                .then(function (content) {
                // the .ncx file tells us that the first chapter is in the main0.xml file.
                    assert.ok(content.indexOf("One morning, as Gregor Samsa was waking up from anxious dreams") !== -1, "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);
        });

        // a showcase in http://msdn.microsoft.com/en-us/windows/hardware/gg463429
        JSZipTestUtils.testZipFile("Outlook2007_Calendar.xps, createFolders: false", "ref/complex_files/Outlook2007_Calendar.xps", function(assert, file) {

            var done = assert.async();
            JSZip.loadAsync(file, {createFolders: false})
                .then(function(zip) {
                // the zip file contains 15 entries.
                    assert.equal(zip.filter(function(){return true;}).length, 15, "the zip contains the good number of elements.");
                    return zip.file("[Content_Types].xml").async("string");
                })
                .then(function (content) {
                    assert.ok(content.indexOf("application/vnd.ms-package.xps-fixeddocument+xml") !== -1, "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);
        });

        // Same test as above, but with createFolders option set to true
        JSZipTestUtils.testZipFile("Outlook2007_Calendar.xps, createFolders: true", "ref/complex_files/Outlook2007_Calendar.xps", function(assert, file) {
            var done = assert.async();
            JSZip.loadAsync(file, {createFolders: true})
                .then(function(zip) {
                // the zip file contains 15 entries, but we get 23 when creating all the sub-folders.
                    assert.equal(zip.filter(function(){return true;}).length, 23, "the zip contains the good number of elements.");
                    return zip.file("[Content_Types].xml").async("string");
                })
                .then(function (content) {
                    assert.ok(content.indexOf("application/vnd.ms-package.xps-fixeddocument+xml") !== -1, "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);
        });

        // an example file in http://cheeso.members.winisp.net/srcview.aspx?dir=js-unzip
        // the data come from http://www.antarctica.ac.uk/met/READER/upper_air/
        JSZipTestUtils.testZipFile("AntarcticaTemps.xlsx, createFolders: false", "ref/complex_files/AntarcticaTemps.xlsx", function(assert, file) {
            var done = assert.async();
            JSZip.loadAsync(file, {createFolders: false})
                .then(function(zip) {
                // the zip file contains 17 entries.
                    assert.equal(zip.filter(function(){return true;}).length, 17, "the zip contains the good number of elements.");
                    return zip.file("[Content_Types].xml").async("string");
                }).then(function (content) {
                    assert.ok(content.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml") !== -1, "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);
        });

        // Same test as above, but with createFolders option set to true
        JSZipTestUtils.testZipFile("AntarcticaTemps.xlsx, createFolders: true", "ref/complex_files/AntarcticaTemps.xlsx", function(assert, file) {
            var done = assert.async();
            JSZip.loadAsync(file, {createFolders: true})
                .then(function(zip) {
                // the zip file contains 16 entries, but we get 27 when creating all the sub-folders.
                    assert.equal(zip.filter(function(){return true;}).length, 27, "the zip contains the good number of elements.");
                    return zip.file("[Content_Types].xml").async("string");
                }).then(function (content) {
                    assert.ok(content.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml") !== -1, "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);
        });

        // same as two up, but in the Open Document format
        JSZipTestUtils.testZipFile("AntarcticaTemps.ods, createFolders: false", "ref/complex_files/AntarcticaTemps.ods", function (assert, file) {
            var done = assert.async();
            JSZip.loadAsync(file, {createFolders: false})
                .then(function(zip) {
                // the zip file contains 20 entries.
                    assert.equal(zip.filter(function () {return true;}).length, 20, "the zip contains the good number of elements.");
                    return zip.file("META-INF/manifest.xml").async("string");
                })
                .then(function (content) {
                    assert.ok(content.indexOf("application/vnd.oasis.opendocument.spreadsheet") !== -1, "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);
        });

        // same as above, but in the Open Document format
        JSZipTestUtils.testZipFile("AntarcticaTemps.ods, createFolders: true", "ref/complex_files/AntarcticaTemps.ods", function (assert, file) {
            var done = assert.async();
            JSZip.loadAsync(file, {createFolders: true})
                .then(function(zip) {
                // the zip file contains 19 entries, but we get 27 when creating all the sub-folders.
                    assert.equal(zip.filter(function () {return true;}).length, 27, "the zip contains the good number of elements.");
                    return zip.file("META-INF/manifest.xml").async("string");
                })
                .then(function (content) {
                    assert.ok(content.indexOf("application/vnd.oasis.opendocument.spreadsheet") !== -1, "the zip was correctly read.");
                    done();
                })["catch"](JSZipTestUtils.assertNoError);
        });
    }
});
