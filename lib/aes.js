"use strict";
var sjcl = require("./sjcl");
var utils = require("./utils");
var GenericWorker = require("./stream/GenericWorker");

var passwordVerifierLen = 2;
var authCodeLen = 10;

/**
 * Create a worker that uses sjcl to process file data.
 * @constructor
 * @param dir The direction, 0 for decrypt and 1 for encrypt.
 * @param {Object|bitArray} param the aesKey for decrypt or the options for encrypt.
 */
function AesWorker(dir, param) {
    GenericWorker.call(this, "AesWorker");

    this._aes = null;
    this._aesKey = null;
    this._mac = null;
    this._dir = dir;

    if (this._dir) {
        this._password = param.password;
        this._keyLen = this._macLen = 8 * param.strength + 8;
        this._saltLen = this._keyLen /2;
    } else {
        this._aesKey = param;
    }    

    // the `meta` object from the last chunk received
    // this allow this worker to pass around metadata
    this.meta = {};
}

utils.inherits(AesWorker, GenericWorker);

/**
 * @see GenericWorker.processChunk
 */
AesWorker.prototype.processChunk = function (chunk) {
    this.meta = chunk.meta;

    if (this._aes === null) {
        this._createAes();
    }
    var result = this._aes.update(sjcl.codec.bytes.toBits(chunk.data));
    if (this._dir) {
        this._mac.update(result);
    }

    this.push({
        data : new Uint8Array(sjcl.codec.bytes.fromBits(result)),
        meta : this.meta
    });
};

/**
 * @see GenericWorker.flush
 */
AesWorker.prototype.flush = function () {
    GenericWorker.prototype.flush.call(this);

    if (this._dir) {
        if (this._aes === null) {
            this._createAes();
        }
        var macData = this._mac.digest();
        macData = sjcl.bitArray.clamp(macData, authCodeLen * 8);
    
        this.push({
            data : new Uint8Array(sjcl.codec.bytes.fromBits(macData)),
            meta : {percent: 100}
        });
    }
};

/**
 * @see GenericWorker.cleanUp
 */
AesWorker.prototype.cleanUp = function () {
    GenericWorker.prototype.cleanUp.call(this);
    this._aes = null;
    this._aesKey = null;
    this._mac = null;
};

/**
 * Create the _aes object.
 */
AesWorker.prototype._createAes = function () {
    if (this._dir) {
        var salt = sjcl.random.randomWords(this._saltLen);
        var derivedKey = sjcl.misc.pbkdf2(this._password, salt, 1000, (this._macLen + this._keyLen + passwordVerifierLen) * 8);
        this._aesKey = sjcl.bitArray.bitSlice(derivedKey, 0, this._keyLen * 8);
        var macKey = sjcl.bitArray.bitSlice(derivedKey, this._keyLen * 8, (this._keyLen + this._macLen) * 8);
        var derivedPassVerifier = sjcl.bitArray.bitSlice(derivedKey, (this._keyLen + this._macLen) * 8);
        this._mac = new sjcl.misc.hmac(macKey);
        
        this.push({
            data : new Uint8Array(sjcl.codec.bytes.fromBits(sjcl.bitArray.concat(salt, derivedPassVerifier))),
            meta : {percent: 0}
        });
    }
    
    this._aes = new sjcl.mode.ctrGladman(new sjcl.cipher.aes(this._aesKey), [0, 0, 0, 0]);
};

exports.EncryptWorker = function (options) {
    return new AesWorker(1, options);
};

exports.DecryptWorker = function (key) {
    return new AesWorker(0, key);
};

/**
 * Verify the password of file using sjcl.
 * @param {Uint8Array} data the data to verify.
 * @param {Object} options the options when verifying.
 * @return {Object} the aes key and encrypted file data.
 */
exports.verifyPassword  = function (data, options) {
    var password = options.password;
    var keyLen = 8 * options.strength + 8;
    var macLen = keyLen;
    var saltLen = keyLen / 2;

    var salt = sjcl.codec.bytes.toBits(data.subarray(0, saltLen));
    var derivedKey = sjcl.misc.pbkdf2(password, salt, 1000, (macLen + keyLen + passwordVerifierLen) * 8);
    var derivedPassVerifier = sjcl.bitArray.bitSlice(derivedKey, (keyLen + macLen) * 8);
    var passVerifyValue = sjcl.codec.bytes.toBits(data.subarray(saltLen, saltLen + passwordVerifierLen));
    if (!sjcl.bitArray.equal(passVerifyValue, derivedPassVerifier)) {
        throw new Error("Encrypted zip: incorrect password");
    }

    return {
        key: sjcl.bitArray.bitSlice(derivedKey, 0, keyLen * 8),
        data: data.subarray(saltLen + passwordVerifierLen, -authCodeLen)
    };
};
