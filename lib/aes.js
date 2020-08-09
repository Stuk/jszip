'use strict';
var sjcl = require('./sjcl');
var utils = require("./utils");
var GenericWorker = require("./stream/GenericWorker");

var passwordVerifierLen = 2;
var authCodeLen = 10;

/**
 * Create a worker that uses sjcl to encrypt data.
 * @constructor
 * @param {Object} options the options to use when encrypting.
 */
function EncryptWorker(options) {
    GenericWorker.call(this, "EncryptWorker");

    this._password = options.password;
    this._keyLen = this._macLen = 8 * options.strength + 8;
    this._saltLen = this._keyLen /2;

    this._aes = null;
    this._mac = null;

    // the `meta` object from the last chunk received
    // this allow this worker to pass around metadata
    this.meta = {};
}

utils.inherits(EncryptWorker, GenericWorker);

/**
 * @see GenericWorker.processChunk
 */
EncryptWorker.prototype.processChunk = function (chunk) {
    this.meta = chunk.meta;

    if (this._aes === null) {
        this._createAes();
    }
    var encryptedData = this._aes.update(sjcl.codec.bytes.toBits(chunk.data));
    this._mac.update(encryptedData);

    this.push({
        data : new Uint8Array(sjcl.codec.bytes.fromBits(encryptedData)),
        meta : this.meta
    });
};

/**
 * @see GenericWorker.flush
 */
EncryptWorker.prototype.flush = function () {
    GenericWorker.prototype.flush.call(this);

    if (this._aes === null) {
        this._createAes();
    }
    var macData = this._mac.digest();
    macData = sjcl.bitArray.clamp(macData, authCodeLen * 8);

    this.push({
        data : new Uint8Array(sjcl.codec.bytes.fromBits(macData)),
        meta : {percent: 100}
    });
};

/**
 * @see GenericWorker.cleanUp
 */
EncryptWorker.prototype.cleanUp = function () {
    GenericWorker.prototype.cleanUp.call(this);
    this._aes = null;
    this._mac = null;
};

/**
 * Create the _aes object.
 */
EncryptWorker.prototype._createAes = function () {
    var salt = sjcl.random.randomWords(this._saltLen / 4);
    var derivedKey = sjcl.misc.pbkdf2(this._password, salt, 1000, (this._macLen + this._keyLen + passwordVerifierLen) * 8, sjcl.misc.hmac);

    var aesKey = sjcl.bitArray.bitSlice(derivedKey, 0, this._keyLen * 8);
    this._aes = new sjcl.mode.ctrGladman(new sjcl.cipher.aes(aesKey), [0, 0, 0, 0]);

    var macKey = sjcl.bitArray.bitSlice(derivedKey, this._keyLen * 8, (this._keyLen + this._macLen) * 8);
    this._mac = new sjcl.misc.hmac(macKey);

    var derivedPassVerifier = sjcl.bitArray.bitSlice(derivedKey, (this._keyLen + this._macLen) * 8);
    this.push({
        data : new Uint8Array(sjcl.codec.bytes.fromBits(sjcl.bitArray.concat(salt, derivedPassVerifier))),
        meta : {percent: 0}
    });
};

/**
 * Create a worker that uses sjcl to decrypt data.
 * @constructor
 * @param {bitArray} key the key of AES.
 */
function DecryptWorker(key) {
    GenericWorker.call(this, "DecryptWorker");
    
    this._aes = null;
    this._aesKey = key;

    // the `meta` object from the last chunk received
    // this allow this worker to pass around metadata
    this.meta = {};
}

utils.inherits(DecryptWorker, GenericWorker);

/**
 * @see GenericWorker.processChunk
 */
DecryptWorker.prototype.processChunk = function (chunk) {
    this.meta = chunk.meta;

    if (this._aes === null) {
        this._createAes();
    }

    var decryptedData = this._aes.update(sjcl.codec.bytes.toBits(chunk.data));
    this.push({
        data : new Uint8Array(sjcl.codec.bytes.fromBits(decryptedData)),
        meta : this.meta
    });
};

/**
 * @see GenericWorker.flush
 */
DecryptWorker.prototype.flush = function () {
    GenericWorker.prototype.flush.call(this);
};

/**
 * @see GenericWorker.cleanUp
 */
DecryptWorker.prototype.cleanUp = function () {
    GenericWorker.prototype.cleanUp.call(this);
    this._aes = null;
};

/**
 * create the _aes object. 
 */
DecryptWorker.prototype._createAes = function () {
    this._aes = new sjcl.mode.ctrGladman(new sjcl.cipher.aes(this._aesKey), [0, 0, 0, 0]);
};

exports.EncryptWorker = function (options) {
    return new EncryptWorker(options);
};

exports.DecryptWorker = function (key) {
    return new DecryptWorker(key);
};

/**
 * Verify the password using sjcl.
 * @param {Uint8Array} data the data to verify.
 * @param {Object} options the options when verifying.
 * @return {Object} the aes key and encrypted file data.
 */
exports.verifyPassword  = function (data, options) {
    var password = options.password;
    var keyLen = 8 * options.strength + 8;
    var macLen = keyLen;
    var saltLen = keyLen / 2;

    var salt = sjcl.codec.bytes.toBits(data.slice(0, saltLen));
    var derivedKey = sjcl.misc.pbkdf2(password, salt, 1000, (macLen + keyLen + passwordVerifierLen) * 8, sjcl.misc.hmac);
    var derivedPassVerifier = sjcl.bitArray.bitSlice(derivedKey, (keyLen + macLen) * 8);
    var passVerifyValue = sjcl.codec.bytes.toBits(data.slice(saltLen, saltLen + passwordVerifierLen));
    if (!sjcl.bitArray.equal(passVerifyValue, derivedPassVerifier)) {
        throw new Error("Encrypted zip: incorrect password");
    }

    return {
        key: sjcl.bitArray.bitSlice(derivedKey, 0, keyLen * 8),
        data: data.slice(saltLen + passwordVerifierLen, -authCodeLen)
    };
};
