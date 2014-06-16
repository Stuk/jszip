'use strict';

var utils = require('../utils');
var support = require('../support');
var StringReader = require('./stringReader');
var NodeBufferReader = require('./nodeBufferReader');
var Uint8ArrayReader = require('./uint8ArrayReader');

/**
 * Create a reader adapted to the data.
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to read.
 * @param {boolean} optimizedBinaryString true if the data is a binary string, false otherwise.
 * @return {DataReader} the data reader.
 */
module.exports = function (data, optimizedBinaryString) {
    var type = utils.getTypeOf(data);
    if (type === "string" && !support.uint8array) {
        return new StringReader(data, optimizedBinaryString);
    }
    if (type === "nodebuffer") {
        return new NodeBufferReader(data);
    }

    return new Uint8ArrayReader(utils.transformTo("uint8array", data));
};

// vim: set shiftwidth=4 softtabstop=4:
