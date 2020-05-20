'use strict';
var sjcl = require('sjcl');

var getGlobal = function () {
    if (typeof self !== 'undefined') { return self; }
    if (typeof window !== 'undefined') { return window; }
    if (typeof global !== 'undefined') { return global; }
    throw new Error('unable to locate global object');
};
var global = getGlobal();
global.sjcl = sjcl;

require('sjcl/core/bitArray');
require('sjcl/core/sha1');
require('sjcl/core/sha256');
require('sjcl/core/codecBytes');
require('sjcl/core/codecString');
require('sjcl/core/random');
require('sjcl/core/aes');
require('sjcl/core/pbkdf2');
require('sjcl/core/hmac');
require('./ctrGladman');

sjcl.misc.hmacSha1 = function (key) {
    sjcl.misc.hmac.call(this, key, sjcl.hash.sha1);
};
sjcl.misc.hmacSha1.prototype = new sjcl.misc.hmac("");
sjcl.misc.hmacSha1.prototype.constructor = sjcl.misc.hmacSha1;

function AesWorker(action, options) {
    this._crypto = sjcl;
    this._aesAction = action;
    this._password = options.password;
    this._keyLen = 8 * options.strength + 8;
    this._macLen = this._keyLen;
    this._saltLen = this._keyLen / 2;
    this._version = options.version;
    this._passVerifyLen = 2;
}

AesWorker.prototype.processData = function (data) {
    var hmac;
    var iv = [0, 0, 0, 0];

    var salt = this._aesAction === "Encrypt" ?
        this._crypto.random.randomWords(this._saltLen / 4) :
        this._crypto.codec.bytes.toBits(data.slice(0, this._saltLen));
    var derivedKey = this._crypto.misc.pbkdf2(this._password, salt, 1000, (this._macLen + this._keyLen + this._passVerifyLen) * 8, this._crypto.misc.hmacSha1);

    var aesKey = this._crypto.bitArray.bitSlice(derivedKey, 0, this._keyLen * 8);
    var macKey = this._crypto.bitArray.bitSlice(derivedKey, this._keyLen * 8, (this._keyLen + this._macLen) * 8);
    var derivedPassVerifier = this._crypto.bitArray.bitSlice(derivedKey, (this._keyLen + this._macLen) * 8);

    if (this._aesAction === "Encrypt") {
        var encryptedData = this._crypto.mode.ctrGladman.encrypt(new this._crypto.cipher.aes(aesKey), this._crypto.codec.bytes.toBits(data), iv);
        encryptedData = this._crypto.bitArray.clamp(encryptedData, (data.length) * 8);

        hmac = new this._crypto.misc.hmacSha1(macKey);
        var macData = hmac.encrypt(encryptedData);
        macData = this._crypto.bitArray.clamp(macData, 10 * 8);

        var fileData = this._crypto.bitArray.concat(salt, derivedPassVerifier);
        fileData = this._crypto.bitArray.concat(fileData, encryptedData);
        fileData = this._crypto.bitArray.concat(fileData, macData);
        return Uint8Array.from(this._crypto.codec.bytes.fromBits(fileData));
    } else {
        var passVerifyValue = this._crypto.codec.bytes.toBits(data.slice(this._saltLen, this._saltLen + this._passVerifyLen));
        if (!this._crypto.bitArray.equal(passVerifyValue, derivedPassVerifier)) {
            throw new Error("Encrypted zip: incorrect password");
        }

        var encryptedValue = this._crypto.codec.bytes.toBits(data.slice(this._saltLen + this._passVerifyLen, -10));
        var macValue = this._crypto.codec.bytes.toBits(data.slice(-10));
        // if AE-2 format check mac
        if (this._version === 2) {
            hmac = new this._crypto.misc.hmacSha1(macKey);
            var macVerifier = hmac.encrypt(encryptedValue);
            macVerifier = this._crypto.bitArray.clamp(macVerifier, 10 * 8);
            if (!this._crypto.bitArray.equal(macValue, macVerifier)) {
                throw new Error("Corrupted zip: CRC failed");
            }
        }

        var decryptData = this._crypto.mode.ctrGladman.decrypt(new this._crypto.cipher.aes(aesKey), encryptedValue, iv);
        return Uint8Array.from(this._crypto.codec.bytes.fromBits(decryptData));
    }
};

exports.encryptWorker = function (encryptOptions) {
    return new AesWorker("Encrypt", encryptOptions);
};
exports.decryptWorker = function (decryptOptions) {
    return new AesWorker("Decrypt", decryptOptions);
};
