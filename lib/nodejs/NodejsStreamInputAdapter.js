"use strict";

var utils = require('../utils');
var GenericWorker = require('../stream/GenericWorker');

/**
 * A worker that use a nodejs stream as source.
 * @constructor
 * @param {Readable} stream the nodejs stream.
 */
function NodejsStreamInputAdapter(stream) {
    GenericWorker.call(this, "Adapter for nodejs stream");
    var self = this;
    stream
    .on("data", function (chunk) {
        self.push({
            data: chunk,
            meta : {
                percent : 0
            }
        });
    })
    .on("error", function (e) {
        self.error(e);
    })
    .on("end", function () {
        self.end();
    })
    .pause();
    this._stream = stream;
}

utils.inherits(NodejsStreamInputAdapter, GenericWorker);
NodejsStreamInputAdapter.prototype.supportSync = function () {
    return false;
};
NodejsStreamInputAdapter.prototype.pause = function () {
    this._stream.pause();
    GenericWorker.prototype.pause.call(this);
};
NodejsStreamInputAdapter.prototype.resume = function (isSync) {
    this._stream.resume();
    GenericWorker.prototype.resume.call(this, isSync);
};

module.exports = NodejsStreamInputAdapter;
