'use strict';

var utils = require("./utils");

exports.STORE = {
    magic: "\x00\x00",
    compress: function(content) {
        return content; // no compression
    },
    uncompress: function(content) {
        // return content; // no compression

        var result = content;
        if (utils.getTypeOf(content) === "uint8array") {
            // when reading an arraybuffer, the CompressedObject mechanism will
            // keep it and subarray() a Uint8Array. If we request a file in the
            // same format, we might get the same Uint8Array or its ArrayBuffer
            // (the original zip file). This only happens with STORE since
            // other compression methods will create a new ArrayBuffer.
            result = new Uint8Array(content.length);
            // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
            if (result.length !== 0) {
                result.set(content, 0);
            }
        }

        return result;
    },
    compressInputType: null,
    uncompressInputType: null
};
exports.DEFLATE = require('./flate');
