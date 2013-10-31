'use strict';
var  Zlib = require('zlibjs/bin/rawdeflate.min').Zlib
module.exports = function(input) {
    var deflate = new Zlib.RawDeflate(input);
    return deflate.compress();
};
