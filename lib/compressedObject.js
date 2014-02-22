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
        var compressedFileData = utils.transformTo(this.compression.uncompressInputType, this.getCompressedContent());
        var uncompressedFileData = this.compression.uncompress(compressedFileData);

        if (uncompressedFileData.length !== this.uncompressedSize) {
            throw new Error("Bug : uncompressed data size mismatch");
        }

        return uncompressedFileData;
    },
    /**
     * Return the compressed content in an unspecified format.
     * The format will depend on the compressed conten source.
     * @return {Object} the compressed content.
     */
    getCompressedContent: function() {
        return this.compressedContent;
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
    }
};
module.exports = CompressedObject;

// vim: set shiftwidth=4 softtabstop=4:
