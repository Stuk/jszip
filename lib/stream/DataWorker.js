'use strict';

var utils = require('../utils');
var GenericWorker = require('./GenericWorker');

// the size of the generated chunks
// TODO expose this as a public variable
var DEFAULT_BLOCK_SIZE = 16 * 1024;

/**
 * A worker that reads a content and emits chunks.
 * @constructor
 * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to split
 */
function DataWorker(data) {
    var dataType = utils.getTypeOf(data);
    GenericWorker.call(this, "DataWorker for " + dataType);

    this.index = 0;
    this.max = data && data.length || 0;
    this.data = data;
    this.type = dataType;

    this._tickID = null;
}

utils.inherits(DataWorker, GenericWorker);

/**
 * @see GenericWorker.cleanUp
 */
DataWorker.prototype.cleanUp = function () {
    GenericWorker.prototype.cleanUp.call(this);
    if(this._tickID) {
        utils.clearDelay(this._tickID);
        this._tickID = null;
    }
    this.data = null;
};

/**
 * @see GenericWorker.pause
 */
DataWorker.prototype.pause = function () {
    if(this.isPaused) {
        return;
    }
    GenericWorker.prototype.pause.call(this);
    if(this._tickID) {
        utils.clearDelay(this._tickID);
        this._tickID = null;
    }
};

/**
 * @see GenericWorker.resume
 */
DataWorker.prototype.resume = function () {
    if(!this.isPaused) {
        return;
    }
    GenericWorker.prototype.resume.call(this);

    if (!this._tickID) {
        this._tickID = utils.delay(this._tickAndRepeat, [], this);
    }
};

/**
 * Trigger a tick a schedule an other call to this function.
 */
DataWorker.prototype._tickAndRepeat = function() {
    this._tick();
    if(!this.isFinished) {
        this._tickID = utils.delay(this._tickAndRepeat, [], this);
    }
};

/**
 * Read and push a chunk.
 */
DataWorker.prototype._tick = function() {

    var size = DEFAULT_BLOCK_SIZE;
    var data = null, nextIndex = Math.min(this.max, this.index + size);
    if (this.index >= this.max) {
        // EOF
        return this.end();
    } else {
        switch(this.type) {
            case "string":
                data = this.data.substring(this.index, nextIndex);
            break;
            case "uint8array":
                data = this.data.subarray(this.index, nextIndex);
            break;
            case "array":
            case "nodebuffer":
                data = this.data.slice(this.index, nextIndex);
            break;
        }
        this.index = nextIndex;
        return this.push({
            data : data,
            meta : {
                percent : this.max ? this.index / this.max * 100 : 0
            }
        });
    }
};

module.exports = DataWorker;
