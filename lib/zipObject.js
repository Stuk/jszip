'use strict';

var utils = require('./utils');
var crc32 = require('./crc32');
var base64 = require('./base64');
var utf8 = require('./utf8');
var CompressedObject = require('./compressedObject');

/**
 * Convert the content of the current ZipObject into the specified format.
 * @param {String} outputType the type of the returned value.
 * @param {Boolean} askUnicodeString when the outputType is a string.
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
 * Convert the content of the current ZipObject into the specified format.
 * @param {String} outputType the type of the returned value.
 * @param {Boolean} askUnicodeString when the outputType is a string.
 *  set to true if the output must be an unicode string.
 *  Set it to false to get a binary string.
 * @param {Function} callback the function to call with the result.
 *  The callback is called with :
 *  - an error (if any)
 *  - the result.
 */
var convertContentAsync = function (outputType, askUnicodeString, callback) {
    var self = this;
    utils.asyncSequence(null, [function (res, cb) {
        self._decompressAsync(cb);
    }, function (res, cb) {
        if (self.options.base64) {
            res = base64.decode(res);
        }

        var isUnicodeString = !self.options.binary && utils.getTypeOf(res) === "string";

        if (isUnicodeString && !askUnicodeString) {
            utf8.utf8encodeAsync(res, cb);
        } else if (!isUnicodeString && askUnicodeString) {
            utf8.utf8decodeAsync(res, cb);
        } else {
            utils.delay(cb, [null, res]);
        }
    }, function (res, cb) {
        utils.delay(cb, [null, utils.transformTo(outputType, res)]);
    }], callback);
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
     * Convert the content as UTF8 string.
     * @param {Function} cb the callback which will receive an error (if any)
     * and the converted content.
     */
    asTextAsync: function(cb) {
        convertContentAsync.call(this, "string", true, cb);
    },
    /**
     * Convert the content as a binary string.
     * @param {Function} cb the callback which will receive an error (if any)
     * and the converted content.
     */
    asBinaryAsync: function(cb) {
        convertContentAsync.call(this, "string", false, cb);
    },
    /**
     * Convert the content as a nodejs Buffer.
     * @param {Function} cb the callback which will receive an error (if any)
     * and the converted content.
     */
    asNodeBufferAsync: function(cb) {
        convertContentAsync.call(this, "nodebuffer", false, cb);
    },
    /**
     * Convert the content as an Uint8Array.
     * @param {Function} cb the callback which will receive an error (if any)
     * and the converted content.
     */
    asUint8ArrayAsync: function(cb) {
        convertContentAsync.call(this, "uint8array", false, cb);
    },
    /**
     * Convert the content as an ArrayBuffer.
     * @param {Function} cb the callback which will receive an error (if any)
     * and the converted content.
     */
    asArrayBufferAsync: function(cb) {
        convertContentAsync.call(this, "arraybuffer", false, cb);
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
     * Compress the _data into a CompressedObject.
     * @private
     * @param {Object} compression the compression to use.
     *  The callback is called with :
     *  - an error (if any)
     *  - the CompressedObject.
     */
    _compressAsync: function(compression, callback) {

        var self = this;
        if (this._data instanceof CompressedObject) {
            this._data.recompressAsync(compression, callback);
        } else {
            // no (yet) compressed
            utils.asyncSequence(this, [function(zipObject, cb) {
                convertContentAsync.call(zipObject, compression.compressInputType, false, cb);
            }, function (content, contentCallback) {
                // an other call to asyncSequence to keep the content in a closure.
                utils.asyncSequence(content, [compression.compressAsync, function (compressedContent, cb) {
                    var uncompressedSize = content.length;
                    var contentCrc32 = crc32(content);
                    var compressedSize = compressedContent.length;

                    self._data = new CompressedObject(compressedSize, uncompressedSize, contentCrc32, compression, compressedContent);

                    cb(null, self._data);
                }], contentCallback);
            }], callback);
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
        }
        return this._data;
    },
    /**
     * Decompress the _data (from a CompressedObject).
     * @param {Function} callback the function to call with the decompressed content.
     *  The callback is called with :
     *  - an error (if any)
     *  - the decompressed content in an unspecified format.
     * @private
     */
    _decompressAsync: function(callback) {
        var self = this;
        if (this._data instanceof CompressedObject) {
            this._data.getContentAsync(function (err, content) {
                if(!err) {
                    self._data = content;
                    // just to be sure
                    self.options.base64 = false;
                    self.options.binary = true;
                }
                callback(err, content);
            });
        } else {
            utils.delay(callback, [null, this._data]);
        }
    }
};

module.exports = ZipObject;

// vim: set shiftwidth=4 softtabstop=4:
