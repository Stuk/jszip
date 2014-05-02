'use strict';

var StreamHelper = require('./stream/StreamHelper');
var DataWorker = require('./stream/DataWorker');
var utf8 = require('./utf8');
var CompressedObject = require('./compressedObject');
var GenericWorker = require('./stream/GenericWorker');

var convertContentWorker = function (outputType, askUnicodeString) {
    var result = this._decompressWorker();

    var isUnicodeString = !this.options.binary;

    if (isUnicodeString && !askUnicodeString) {
        result = result.pipe(new utf8.Utf8EncodeWorker());
    }
    if (!isUnicodeString && askUnicodeString) {
        result = result.pipe(new utf8.Utf8DecodeWorker());
    }

    return new StreamHelper(result, outputType);
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
        return this.asTextStream()._resolveSync();
    },
    asTextStream: function() {
        return convertContentWorker.call(this, "string", true);
    },
    /**
     * Returns the binary content.
     * @return {string} the content as binary.
     */
    asBinary: function() {
        return this.asBinaryStream()._resolveSync();
    },
    asBinaryStream: function() {
        return convertContentWorker.call(this, "string", false);
    },
    /**
     * Returns the content as a nodejs Buffer.
     * @return {Buffer} the content as a Buffer.
     */
    asNodeBuffer: function() {
        return this.asNodeBufferStream()._resolveSync();
    },
    asNodeBufferStream: function() {
        return convertContentWorker.call(this, "nodebuffer", false);
    },
    /**
     * Returns the content as an Uint8Array.
     * @return {Uint8Array} the content as an Uint8Array.
     */
    asUint8Array: function() {
        return this.asUint8ArrayStream()._resolveSync();
    },
    asUint8ArrayStream: function() {
        return convertContentWorker.call(this, "uint8array", false);
    },
    /**
     * Returns the content as an ArrayBuffer.
     * @return {ArrayBuffer} the content as an ArrayBufer.
     */
    asArrayBuffer: function() {
        return this.asArrayBufferStream()._resolveSync();
    },
    asArrayBufferStream: function() {
        return convertContentWorker.call(this, "arraybuffer", false);
    },

    _compressWorker: function (compression) {
        if (
            this._data instanceof CompressedObject &&
            this._data.compression.magic === compression.magic
        ) {
            return this._data.getCompressedWorker();
        } else {
            var result = this._decompressWorker();
            if(!this.options.binary) {
                result = result.pipe(new utf8.Utf8EncodeWorker());
            }
            return CompressedObject.createWorkerFrom(result, compression);
        }
    },
    _decompressWorker : function () {
        if (this._data instanceof CompressedObject) {
            return this._data.getContentWorker();
        } else if (this._data instanceof GenericWorker) {
            return this._data;
        } else {
            return new DataWorker(this._data);
        }
    }
};

module.exports = ZipObject;
