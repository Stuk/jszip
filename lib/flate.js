'use strict';
var USE_TYPEDARRAY = (typeof Uint8Array !== 'undefined') && (typeof Uint16Array !== 'undefined') && (typeof Uint32Array !== 'undefined');

var pako = require("pako");
var utils = require("./utils");

var nodejsUtils = require('./nodejsUtils');

var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";
exports.uncompressInputType = null; // the conversion is handled in each method.
exports.compressInputType = null; // the conversion is handled in each method.

exports.magic = "\x08\x00";
exports.compress = function(input) {
    input = utils.transformTo(ARRAY_TYPE, input);
    return pako.deflateRaw(input);
};
exports.uncompress =  function(input) {
    input = utils.transformTo(ARRAY_TYPE, input);
    return pako.inflateRaw(input);
};

exports.compressAsync = function (input, callback) {
    // if possible, use the nodejs zlib interface.
    if (nodejsUtils.zlib) {
        nodejsUtils.zlib.deflateRaw(
            utils.transformTo("nodebuffer", input),
            callback
        );
        return;
    }
    flateAsync("Deflate", input, callback);
};

/**
 * Prepare the function needed to INFLATE or DEFLATE the part between
 * `from` and `to` in the input.
 * @param {Uint8Array|Array} input the compressed input.
 * @param {String} type the type of the input.
 * @param {Number} from the starting index for this execution.
 * @param {Number} to the ending index for this execution.
 * @return {Function} the function, ready to be called by utils.asyncSequence.
 */
function prepareFlateAsync(input, type, from, to) {
    input = utils.transformTo(ARRAY_TYPE, input);
    return function (inflate, cb) {
        if (type === "uint8array") {
            inflate.push(input.subarray(from, to), false);
        } else {
            inflate.push(input.slice(from, to), false);
        }
        utils.delay(cb, [inflate.err, inflate]);
    };
}

/**
 * Inflate or deflate an input by chunks.
 * @param {String} action "Inflate" or "Deflate", the name of pako's objects.
 * @param {Uint8Array|Array} input the input to inflate / deflate.
 * @param {Function} callback the function to call when the result is ready.
 *  The callback is called with :
 *  - an error (if any)
 *  - the inflated / deflated result.
 */
function flateAsync(action, input, callback) {
    var len = input.length, from = 0, to = 0, chunk = 1 << 20;
    var type = utils.getTypeOf(input);
    var flate = new pako[action]({raw:true});

    var steps = [];

    // for large content, we should split the work into smaller chunk
    while (from < len) {
        to = Math.min(from + chunk, len);
        steps.push(prepareFlateAsync(input, type, from, to));
        from += chunk;
    }

    utils.asyncSequence.call(utils, flate, steps, function (err, flate) {
        if(err) {
            callback(err, null);
            return;
        }

        // dummy push, force end
        flate.push([], true);
        if(flate.err) {
            callback(new Error(action + " : error " + flate.err + " : " + flate.msg), null);
        } else {
            callback(null, flate.result);
        }
    });

}

exports.uncompressAsync = function (input, callback) {
    // if possible, use the nodejs zlib interface.
    if (nodejsUtils.zlib) {
        nodejsUtils.zlib.inflateRaw(
            utils.transformTo("nodebuffer", input),
            callback
        );
        return;
    }

    flateAsync("Inflate", input, callback);
};
