'use strict';
exports.magic = "\x08\x00";
exports.uncompress = require('./inflate');
exports.compress = require('./deflate');
