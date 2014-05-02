'use strict';

var Readable = require('stream').Readable;

var util = require('util');
util.inherits(NodejsStreamOutputAdapter, Readable);

/**
* A nodejs stream using a worker as source.
* @see the SourceWrapper in http://nodejs.org/api/stream.html
* @constructor
* @param {StreamHelper} helper the helper wrapping the worker
* @param {Object} options the nodejs stream options
*/
function NodejsStreamOutputAdapter(helper, options) {
    Readable.call(this, options);
    this._helper = helper;

    var self = this;
    helper.on("data", function (data) {
        if (!self.push(data)) {
            self._helper.pause();
        }
    })
    .on("error", function(e) {
        self.emit('error', e);
    })
    .on("end", function () {
        self.push(null);
    });
}


NodejsStreamOutputAdapter.prototype._read = function() {
    this._helper.resume();
};

module.exports = NodejsStreamOutputAdapter;
