'use strict';
var CryptoJS = require('crypto-js/core');
require('crypto-js/lib-typedarrays');
require('crypto-js/aes');
require('crypto-js/pbkdf2');
require('crypto-js/hmac-sha1');
require('crypto-js/mode-ctr-gladman');
require('crypto-js/pad-nopadding');

var utils = require("../utils");
var GenericWorker = require("./GenericWorker");
var AesKeyStrength  = {
    1:{
        saltLength: 8,
        macLength: 16,
        keyLength: 16
    },
    2:{
        saltLength: 12,
        macLength: 24,
        keyLength: 24
    },
    3:{
        saltLength: 16,
        macLength: 32,
        keyLength: 32
    }
};

/**
 * Create a worker that uses CryptoJS to encrypt/decrypt.
 * @constructor
 * @param {String} action the name of the CryptoJS to call : either "Encrypt" or "Decrypt".
 * @param {Object} options the options to use when (de)crypting.
 */
function AesWorker(action, options) {
    GenericWorker.call(this, "AesWorker/" + action);

    this._crypto = CryptoJS;
    this._aesAction = action;
    this._password = options.password;
    this._saltLen = AesKeyStrength[options.strength].saltLength;
    this._macLen = AesKeyStrength[options.strength].macLength;
    this._keyLen = AesKeyStrength[options.strength].keyLength;
    this._version = options.version;
    this._passVerifyLen = 2;

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
    var data = chunk.data;

    var fileData;
    var salt = this._aesAction === "Encrypt" ? this._crypto.lib.WordArray.random(this._saltLen) : this._crypto.lib.WordArray.create(data.slice(0, this._saltLen));
    var derivedKey = this._crypto.PBKDF2(this._password, salt, {
        keySize: (this._macLen + this._keyLen + this._passVerifyLen) / 4,
        iterations: 1000
    }).toString();
    var aesKey = this._crypto.enc.Hex.parse(derivedKey.slice(0, this._keyLen * 2));
    var macKey = this._crypto.enc.Hex.parse(derivedKey.slice(this._keyLen * 2, (this._keyLen + this._macLen) * 2));
    var derivedPassVerifier = derivedKey.slice(-this._passVerifyLen * 2);
    if (this._aesAction === "Encrypt") {
        derivedPassVerifier = this._crypto.enc.Hex.parse(derivedPassVerifier);

        var encryptedData = this._crypto.AES.encrypt(this._crypto.lib.WordArray.create(data),
            aesKey,
            {
                iv: this._crypto.enc.Hex.parse("0"),
                mode: this._crypto.mode.CTRGladman,
                padding: this._crypto.pad.NoPadding
            }
        ).ciphertext;
        encryptedData.clamp();

        var macData = this._crypto.HmacSHA1(encryptedData, macKey);
        macData.sigBytes = 10;

        fileData = this.wordArrayToUint8Array(salt.concat(derivedPassVerifier).concat(encryptedData).concat(macData));
    }else{
        var passVerifyValue = this._crypto.lib.WordArray.create(data.slice(this._saltLen, this._saltLen + this._passVerifyLen)).toString(this._crypto.enc.Hex);
        if(passVerifyValue !== derivedPassVerifier){
            throw new Error("Wrong Password!");
        }

        var encryptedValue = this._crypto.lib.WordArray.create(data.slice(this._saltLen + this._passVerifyLen, -10));
        var macValue = this._crypto.lib.WordArray.create(data.slice(-10)).toString(this._crypto.enc.Hex);
        // if AE-2 format check mac
        if(this._version === 2){
            var macVerifier = this._crypto.HmacSHA1(encryptedValue, macKey).toString().slice(0, 20);
            if(macValue !== macVerifier){
                throw new Error("Corrupted encrypted data!");
            }
        }

        var decryptData = this._crypto.AES.decrypt({ciphertext: encryptedValue},
            aesKey,
            {
                iv: this._crypto.enc.Hex.parse("0"),
                mode: this._crypto.mode.CTRGladman,
                padding: this._crypto.pad.NoPadding
            }
        );
        fileData = this.wordArrayToUint8Array(decryptData);
    }
    
    this.push({
        data : fileData,
        meta : this.meta
    });
};

AesWorker.prototype.wordArrayToUint8Array = function(wordArray) {                                                                                       
    var l = wordArray.sigBytes;                                                                                                        
    var words = wordArray.words;                                                                                                       
    var result = new Uint8Array(l);                                                                                                    
    var i=0, j=0;
    while(true) {
        if (i===l) {break;}
        var w = words[j++];
        result[i++] = (w & 0xff000000) >>> 24;
        if (i===l) {break;}
        result[i++] = (w & 0x00ff0000) >>> 16;                                                                                            
        if (i===l) {break;}                                                                                                                      
        result[i++] = (w & 0x0000ff00) >>> 8;
        if (i===l) {break;}
        result[i++] = (w & 0x000000ff);                                                                                                  
    }
    return result;
};

/**
 * @see GenericWorker.flush
 */
AesWorker.prototype.flush = function () {
    GenericWorker.prototype.flush.call(this);
};
/**
 * @see GenericWorker.cleanUp
 */
AesWorker.prototype.cleanUp = function () {
    GenericWorker.prototype.cleanUp.call(this);
    this._crypto = null;
};

exports.encryptWorker = function (encryptOptions) {
    return new AesWorker("Encrypt", encryptOptions);
};
exports.decryptWorker = function (decryptOptions) {
    return new AesWorker("Decrypt", decryptOptions);
};
