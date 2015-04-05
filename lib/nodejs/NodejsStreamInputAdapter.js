"use strict";

var utils = require('../utils');
var GenericWorker = require('../stream/GenericWorker');

/**
 * A worker that use a nodejs stream as source.
 * @constructor
 * @param {Readable} stream the nodejs stream.
 */
function NodejsStreamInputAdapter(stream) {
    GenericWorker.call(this, "Input adapter for nodejs stream");
    this._upstreamEnded = false;
    this._bindStream(stream);
}

utils.inherits(NodejsStreamInputAdapter, GenericWorker);

/**
 * Prepare the stream and bind the callbacks on it.
 * Do this ASAP on node 0.10 ! A lazy binding doesn't always work.
 * @param {Stream} stream the nodejs stream to use.
 */
NodejsStreamInputAdapter.prototype._bindStream = function (stream) {
    var self = this;
    this._stream = stream;
    stream.pause();
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
        if(self.isPaused) {
            this.generatedError = e;
        } else {
            self.error(e);
        }
    })
    .on("end", function () {
        if(self.isPaused) {
            self._upstreamEnded = true;
        } else {
            self.end();
        }
    });
};
NodejsStreamInputAdapter.prototype.pause = function () {
    if(this.isPaused) {
        return;
    }
    this._stream.pause();
    GenericWorker.prototype.pause.call(this);
};
NodejsStreamInputAdapter.prototype.resume = function () {
    if(!this.isPaused) {
        return;
    }
    GenericWorker.prototype.resume.call(this);

    var self = this;
    if(this._upstreamEnded) {
        this.end();
    } else {
        this._stream.resume();
    }
};

module.exports = NodejsStreamInputAdapter;
