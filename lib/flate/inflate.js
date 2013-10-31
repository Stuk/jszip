'use strict';
var  Zlib = require('zlibjs/bin/rawinflate.min').Zlib;
module.exports = function(input) {
    var inflate = new Zlib.RawInflate(input);
    return inflate.decompress();
};
