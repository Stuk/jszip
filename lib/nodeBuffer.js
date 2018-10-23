'use strict';
module.exports = function(data, encoding){
    return Buffer.from(data, encoding);
};
module.exports.test = function(b){
    return Buffer.isBuffer(b);
};
