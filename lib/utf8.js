'use strict';

var utils = require('./utils');
var support = require('./support');
var nodeBuffer = require('./nodeBuffer');

var textEncoder, textDecoder;
if (
    support.uint8array &&
    typeof TextEncoder === "function" &&
    typeof TextDecoder === "function"
) {
    textEncoder = new TextEncoder("utf-8");
    textDecoder = new TextDecoder("utf-8");
}

/**
 * http://www.webtoolkit.info/javascript-utf8.html
 */
exports.utf8encode = function utf8encode(string) {
    // TextEncoder + Uint8Array to binary string is faster than checking every bytes on long strings.
    // http://jsperf.com/utf8encode-vs-textencoder
    // On short strings (file names for example), the TextEncoder API is (currently) slower.
    if (textEncoder) {
        var u8 = textEncoder.encode(string);
        return utils.transformTo("string", u8);
    }
    if (support.nodebuffer) {
        return utils.transformTo("string", nodeBuffer(string, "utf-8"));
    }

    // array.join may be slower than string concatenation but generates less objects (less time spent garbage collecting).
    // See also http://jsperf.com/array-direct-assignment-vs-push/31
    var result = [],
    resIndex = 0;

    for (var n = 0; n < string.length; n++) {

        var c = string.charCodeAt(n);

        if (c < 128) {
            result[resIndex++] = String.fromCharCode(c);
        }
        else if ((c > 127) && (c < 2048)) {
            result[resIndex++] = String.fromCharCode((c >> 6) | 192);
            result[resIndex++] = String.fromCharCode((c & 63) | 128);
        }
        else {
            result[resIndex++] = String.fromCharCode((c >> 12) | 224);
            result[resIndex++] = String.fromCharCode(((c >> 6) & 63) | 128);
            result[resIndex++] = String.fromCharCode((c & 63) | 128);
        }

    }

    return result.join("");
};


/**
 * http://www.webtoolkit.info/javascript-utf8.html
 */
exports.utf8decode = function utf8decode(input) {
    var result = [],
    resIndex = 0;
    var type = utils.getTypeOf(input);
    var isArray = type !== "string";
    var i = 0;
    var c = 0,
    c1 = 0,
    c2 = 0,
    c3 = 0;

    // check if we can use the TextDecoder API
    // see http://encoding.spec.whatwg.org/#api
    if (textDecoder) {
        return textDecoder.decode(
            utils.transformTo("uint8array", input)
        );
    }
    if (support.nodebuffer) {
        return utils.transformTo("nodebuffer", input).toString("utf-8");
    }

    while (i < input.length) {

        c = isArray ? input[i] : input.charCodeAt(i);

        if (c < 128) {
            result[resIndex++] = String.fromCharCode(c);
            i++;
        }
        else if ((c > 191) && (c < 224)) {
            c2 = isArray ? input[i + 1] : input.charCodeAt(i + 1);
            result[resIndex++] = String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = isArray ? input[i + 1] : input.charCodeAt(i + 1);
            c3 = isArray ? input[i + 2] : input.charCodeAt(i + 2);
            result[resIndex++] = String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }

    }

    return result.join("");
};
// vim: set shiftwidth=4 softtabstop=4:
