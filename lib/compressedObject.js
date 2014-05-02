'use strict';

var utils = require('./utils');

/**
 * Represent a compressed object, with everything needed to decompress it.
 * @constructor
 * @param {number} compressedSize the size of the data compressed.
 * @param {number} uncompressedSize the size of the data after decompression.
 * @param {number} crc32 the crc32 of the decompressed file.
 * @param {object} compression the type of compression, see lib/compressions.js.
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the compressed data.
 */
function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
    this.compressedSize = compressedSize;
    this.uncompressedSize = uncompressedSize;
    this.crc32 = crc32;
    this.compression = compression;
    this.compressedContent = data;
}

CompressedObject.prototype = {
    /**
     * Return the decompressed content in an unspecified format.
     * The format will depend on the decompressor.
     * @return {Object} the decompressed content.
     */
    getContent: function() {
        var compressedFileData = utils.transformTo(this.compression.uncompressInputType, this.compressedContent);
        var uncompressedFileData = this.compression.uncompress(compressedFileData);

        if (uncompressedFileData.length !== this.uncompressedSize) {
            throw new Error("Bug : uncompressed data size mismatch");
        }
        return uncompressedFileData;
    },
    /**
     * Get the decompressed content in an unspecified format.
     * The format will depend on the decompressor.
     * @param {Function} callback the callback to call when the content is ready.
     *  The callback is called with :
     *  - an error (if any)
     *  - the decompressed content.
     */
    getContentAsync: function(callback) {
        var compressedFileData = utils.transformTo(this.compression.uncompressInputType, this.compressedContent);
        var self = this;
        this.compression.uncompressAsync(compressedFileData, function (err, uncompressedFileData) {
            if(!err) {
                if (uncompressedFileData.length !== self.uncompressedSize) {
                    err = new Error("Bug : uncompressed data size mismatch");
                }
            }
            callback(err, uncompressedFileData);
        });
    },
    /**
     * Change the compression type (DEFLATE -> STORE for example).
     * @param {Object} compression the new compression.
     */
    recompress: function (compression) {
        if (this.compression.magic !== compression.magic) {
            var content = this.getContent();
            // need to decompress / recompress
            this.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content));
            this.compressedSize = this.compressedContent.length;
            this.compression = compression;
        }
    },
    /**
     * Change the compression type (DEFLATE -> STORE for example).
     * @param {Object} compression the new compression.
     * @param {Function} callback the function to call with the result.
     *  The callback is called with :
     *  - an error (if any)
     *  - the current CompressedObject, with the right compression.
     */
    recompressAsync: function (compression, callback) {
        if (this.compression.magic !== compression.magic) {
            // need to decompress / recompress
            var self = this;
            utils.asyncSequence(this, [
                function(compressed, cb) {
                    compressed.getContentAsync(cb);
                }, function (content, cb) {
                    compression.compressAsync(utils.transformTo(compression.compressInputType, content), cb);
                }, function (compressedContent, cb) {
                    self.compressedContent = compressedContent;
                    self.compressedSize = self.compressedContent.length;
                    self.compression = compression;
                    cb(null, self);
                }
            ], callback);
        } else {
            callback(null, this);
        }
    }
};
module.exports = CompressedObject;

// vim: set shiftwidth=4 softtabstop=4:
