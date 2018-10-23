'use strict';
module.exports = function(data, encoding){
    if (typeof data === 'number') {
        return Buffer.alloc(data);
    }

    return Buffer.from(data, encoding);
};
module.exports.test = function(b){
    return Buffer.isBuffer(b);
};
