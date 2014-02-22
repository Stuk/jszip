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
 * Returns the raw data of a ZipObject, decompress the content if necessary.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */
var getRawData = function(file) {
    file._decompress();
    return file._data;
};

/**
 * Returns the data of a ZipObject in a binary form. If the content is an unicode string, encode it.
 * @param {ZipObject} file the file to use.
 * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
 */
var getBinaryData = function(file) {
    var result = getRawData(file),
        type = utils.getTypeOf(result);
    if (type === "string") {
        if (!file.options.binary) {
            // unicode text !
            if (support.nodebuffer) {
                return nodeBuffer(result, "utf-8");
            }
        }
        return file.asBinary();
    }
    return result;
};

/**
 * Transform this._data into a string.
 * @param {function} filter a function String -> String, applied if not null on the result.
 * @return {String} the string representing this._data.
 */
var dataToString = function(asUTF8) {
    var result = getRawData(this);
    if (result === null || typeof result === "undefined") {
        return "";
    }
    // if the data is a base64 string, we decode it before checking the encoding !
    if (this.options.base64) {
        result = base64.decode(result);
    }
    if (asUTF8 && this.options.binary) {
        // JSZip.prototype.utf8decode supports arrays as input
        // skip to array => string step, utf8decode will do it.
        result = utf8.utf8decode(result);
    }
    else {
        // no utf8 transformation, do the array => string step.
        result = utils.transformTo("string", result);
    }

    if (!asUTF8 && !this.options.binary) {
        result = utils.transformTo("string", out.utf8encode(result));
    }
    return result;
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
        return dataToString.call(this, true);
    },
    /**
     * Returns the binary content.
     * @return {string} the content as binary.
     */
    asBinary: function() {
        return dataToString.call(this, false);
    },
    /**
     * Returns the content as a nodejs Buffer.
     * @return {Buffer} the content as a Buffer.
     */
    asNodeBuffer: function() {
        var result = getBinaryData(this);
        return utils.transformTo("nodebuffer", result);
    },
    /**
     * Returns the content as an Uint8Array.
     * @return {Uint8Array} the content as an Uint8Array.
     */
    asUint8Array: function() {
        var result = getBinaryData(this);
        return utils.transformTo("uint8array", result);
    },
    /**
     * Returns the content as an ArrayBuffer.
     * @return {ArrayBuffer} the content as an ArrayBufer.
     */
    asArrayBuffer: function() {
        return this.asUint8Array().buffer;
    },
    /**
     * Compress the _data into a CompressedObject.
     * @private
     * @param {Object} compression the compression to use.
     */
    _compress: function(compression) {

        if (this._data instanceof CompressedObject) {
            if (this._data.uncompressedSize === 0 || this.options.dir) {
                compression = compressions['STORE'];
                this._data.compressedContent = "";
                this._data.crc32 = 0;
            }
            this._data.recompress(compression);
        } else {
            // no (yet) compressed
            var content = getBinaryData(this);
            if (!content || content.length === 0 || this.options.dir) {
                compression = compressions['STORE'];
                content = "";
            }
            var uncompressedSize = content.length;
            var contentCrc32 = crc32(content);
            var compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content));
            var compressedSize = compressedContent.length;

            this._data = new CompressedObject(compressedSize, uncompressedSize, contentCrc32, compression, compressedContent);
        }

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

            if (utils.getTypeOf(this._data) === "uint8array") {
                var copy = this._data;
                // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
                // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
                this._data = new Uint8Array(copy.length);
                // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
                if (copy.length !== 0) {
                    this._data.set(copy, 0);
                }
            }
        }
    }
};

module.exports = ZipObject;

// vim: set shiftwidth=4 softtabstop=4:
