'use strict';
var  Zlib = require('zlibjs/bin/rawinflate.min').Zlib
module.exports = function(Type){
    return function(input) {
        var inflate = new Zlib.RawInflate(new Type(input));
        return inflate.decompress();
    };
};
