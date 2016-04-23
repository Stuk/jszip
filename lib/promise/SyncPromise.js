
/* a set synchronous promises to use with jszip */

function PromiseBase() {
    this._result = null;
    this._error = null;
    this._state = "PENDING";
    return this;
};

PromiseBase.prototype.result = function() {
    return this._result;
};

PromiseBase.prototype.error = function() {
    return this._error;
};

PromiseBase.prototype.then = function(fulfilled, rejected) {
    return new ThenPromise(this, fulfilled, rejected);
};

function SyncPromise(resolver) {
    PromiseBase.call(this);
    this._resolver = resolver;
    this.run();
    return this;
}

SyncPromise.prototype = Object.create(PromiseBase.prototype);
SyncPromise.prototype.constructor = SyncPromise;

SyncPromise.prototype.run = function() {
    try {
        var self = this;
        this._resolver(
            function (result) {
                self._result = result;
                self._state = "FULFILLED";
            },
            function (error) {
                self._error = error;
                self._state = "REJECTED";
            });
    } catch (e) {
        this._error = e;
        this._state = "REJECTED";
        if(e instanceof Error)
            throw e;
        else
            throw new Error(e);
    }
};

function ThenPromise(promise, fulfilled, rejected) {
    PromiseBase.call(this);
    this._promise = promise;
    this._fulfilled = fulfilled;
    this._rejected = rejected;
    this.run();
    return this;
};

ThenPromise.prototype = Object.create(PromiseBase.prototype);
ThenPromise.prototype.constructor = ThenPromise;

ThenPromise.prototype.run = function() {
    try {
        this._result = this._promise.result();
        this._error = this._promise.error();
        if (this._error) {
            if (this._rejected)
                this._rejected(this._error);
            this._state = "REJECTED";
        } else {
            this._result = this._fulfilled(this._result);
            this._state = "FULFILLED";
        }
    } catch (e) {
        this._error = e;
        this._state = "REJECTED";
        if(e instanceof Error)
            throw e;
        else
            throw new Error(e);
    }
};

function AllPromise(promises) {
    PromiseBase.call(this);
    this._promises = promises;
    this.run();
    return this;
};

AllPromise.prototype = Object.create(PromiseBase.prototype);
AllPromise.prototype.constructor = AllPromise;


AllPromise.prototype.run = function() {
    try {
        var results = [];
        for(var i=0;i<this._promises.length;i++) {
            var promise = this._promises[i];
            var error = promise.error();
            if(error) {
                this._error = error;
                this._state = "REJECTED";
                return;
            }
            var result = promise.result();
            results.push(result);
        }
        this._result = results;
        this._state = "FULFILLED";
    } catch (e) {
        self._error = e;
        self._state = "REJECTED";
        if(e instanceof Error)
            throw e;
        else
            throw new Error(e);
    }
};

SyncPromise.resolve = function(value) {
    var promise = new SyncPromise(function(resolve, reject) {
        resolve(value);
    });
    return promise;
};

SyncPromise.all = function(promises) {
    return new AllPromise(promises).result();
};

exports.SyncPromise = SyncPromise;