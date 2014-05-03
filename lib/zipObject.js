'use strict';

var support = require('./support');
var utils = require('./utils');
var crc32 = require('./crc32');
var nodeBuffer = require('./nodeBuffer');
var base64 = require('./base64');
var utf8 = require('./utf8');
var compressions = require('./compressions');
var CompressedObject = require('./compressedObject');

/**
 * Convert the content of the current ZipObject into the specified format.
 * @param {String} outputType the type of the returned value.
 * @param {Boolean} askUnicodeString when the outputType is a string,
 *  set to true if the output must be an unicode string.
 *  Set it to false to get a binary string.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the result.
 */
var convertContent = function(outputType, askUnicodeString) {
    var result = this._decompress();
    if (this.options.base64) {
        result = base64.decode(result);
    }

    var isUnicodeString = !this.options.binary && utils.getTypeOf(result) === "string";

    if (isUnicodeString && !askUnicodeString) {
        result = utf8.utf8encode(result);
    }
    if (!isUnicodeString && askUnicodeString) {
        result = utf8.utf8decode(result);
    }
    return utils.transformTo(outputType, result);
};

/**
 * A simple object representing a file in the zip file.
 * @constructor
 * @param {string} name the name of the file
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
 * @param {Object} options the options of the file
 */
var ZipObject = function(name, data, options) {
    this.name = name;
    this.dir = options.dir;
    this.date = options.date;
    this.comment = options.comment;

    this._data = data;
    this.options = options;

    /*
     * This object contains initial values for dir and date.
     * With them, we can check if the user changed the deprecated metadata in
     * `ZipObject#options` or not.
     */
    this._initialMetadata = {
      dir : options.dir,
      date : options.date
    };
};

ZipObject.prototype = {
    /**
     * Return the content as UTF8 string.
     * @return {string} the UTF8 string.
     */
    asText: function() {
        return convertContent.call(this, "string", true);
    },
    /**
     * Returns the binary content.
     * @return {string} the content as binary.
     */
    asBinary: function() {
        return convertContent.call(this, "string", false);
    },
    /**
     * Returns the content as a nodejs Buffer.
     * @return {Buffer} the content as a Buffer.
     */
    asNodeBuffer: function() {
        return convertContent.call(this, "nodebuffer", false);
    },
    /**
     * Returns the content as an Uint8Array.
     * @return {Uint8Array} the content as an Uint8Array.
     */
    asUint8Array: function() {
        return convertContent.call(this, "uint8array", false);
    },
    /**
     * Returns the content as an ArrayBuffer.
     * @return {ArrayBuffer} the content as an ArrayBufer.
     */
    asArrayBuffer: function() {
        return convertContent.call(this, "arraybuffer", false);
    },
    /**
     * Compress the _data into a CompressedObject.
     * @private
     * @param {Object} compression the compression to use.
     */
    _compress: function(compression) {

        if (this._data instanceof CompressedObject) {
            this._data.recompress(compression);
        } else {
            // no (yet) compressed
            var content = convertContent.call(this, compression.compressInputType, false);

            var uncompressedSize = content.length;
            var contentCrc32 = crc32(content);
            var compressedContent = compression.compress(content);
            var compressedSize = compressedContent.length;

            this._data = new CompressedObject(compressedSize, uncompressedSize, contentCrc32, compression, compressedContent);
        }

        return this._data;
    },
    /**
     * Decompress the _data (from a CompressedObject).
     * @private
     */
    _decompress: function() {
        if (this._data instanceof CompressedObject) {
            this._data = this._data.getContent();
            // just to be sure
            this.options.base64 = false;
            this.options.binary = true;
        }
        return this._data;
    }
};

module.exports = ZipObject;

// vim: set shiftwidth=4 softtabstop=4:
