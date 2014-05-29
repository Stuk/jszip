'use strict';
var utils = require('./utils');

/**
 * Based on the algorithm described in
 * http://www.pkware.com/documents/casestudies/APPNOTE.TXT
 */

var ZipCrypto = function(loadOptions) {
    this.encryptionKeys = null;
    this.retrievePasswordCallback = loadOptions.retrievePasswordCallback;
    this.retrieveEncryptionKeysCallback = loadOptions.retrieveEncryptionKeysCallback;
    this.invalidPasswordCallback = loadOptions.invalidPasswordCallback;
};

/**
 * Requests password/encryption keys (once), primes the encryption keys, if necessary,
 *   and returns them to the caller.
 * @return {number[]} An array of 3 32-bit numeric pre-primed encryption keys
 * @throws {Error} if the password callbacks are not set or return incorrect data types
 */
ZipCrypto.prototype.getEncryptionKeys = function() {
    if (!this.encryptionKeys) {
        if (typeof this.retrievePasswordCallback != "function" &&
            typeof this.retrieveEncryptionKeysCallback != "function") {
            throw new Error("retrievePasswordCallback or retrieveEncryptionKeysCallback must be set for encrypted ZIP files");
        }
        
        if (this.retrieveEncryptionKeysCallback) {
            var keys = this.retrieveEncryptionKeysCallback();
            if(!(keys instanceof Array)) throw new Error("retrieveEncryptionKeysCallback must return an array of encryption keys");
            if(keys.length != 3) throw new Error("retrieveEncryptionKeysCallback must return an array of 3 encryption keys");
            for(var i=0; i<keys.length; i++) {
                if(typeof keys[i] != 'number' || isNaN(keys[i])) throw new Error("retrieveEncryptionKeysCallback must return an array of numeric keys");
            }
            this.encryptionKeys = keys;
          } else {
            var password = this.retrievePasswordCallback();
            if(!password && password !== '') return; // No password supplied. note that password could be an empty string
            if(typeof password != 'string') {
                throw new Error("retrievePasswordCallback must return a string");
            }
            // Magic values
            this.encryptionKeys = [
                0x12345678,
                0x23456789,
                0x34567890
            ];
            // Prime keys
            for (var j=0; j<password.length; j++) {
                updateKeys(this.encryptionKeys, password.charCodeAt(j));
            }
          }
    }
    
    return this.encryptionKeys.slice(0);  // Don't return originals, since they would get updated as we go
};

/**
 * Calls the callback for invalid password if supplied, otherwise, throws an error
 * @return {boolean} Return value from callback.
 *   TRUE if password validation should be ignored
 * @throws {Error} if invalidPasswordCallback was not supplied
 */
ZipCrypto.prototype.invalidPassword = function(header, crc32) {
    if (typeof this.invalidPasswordCallback != "function") {
        throw new Error("Supplied password is invalid");
    }
    
    return this.invalidPasswordCallback(header, crc32);
};

/**
 * Decrypts data using ZipCrypto algorithm. Validates password if crc32 is supplied
 * @param {Uint8Array} data Data to be decrypted.
 * @param {number} [crc32] CRC32 hash of the data. If supplied, the password is validated.
 * @return {Uint8Array} Decrypted data in the same format as was passed in
 */
ZipCrypto.prototype.decryptData = function(data, crc32) {
    if(data instanceof Uint8Array) {
        return this.decryptDataAsUint8Array(data, crc32);
    }
    
    throw new Error("ZipCrypto decryption is only supported for Uint8Array data");
};

/**
 * @see ZipCrypto.decryptData
 */
ZipCrypto.prototype.decryptDataAsUint8Array = function(data, crc32) {
    var keys = this.getEncryptionKeys();
    for (var i=0; i<data.length; i++) {
        data[i] = decryptByte(keys, data[i]);
        if (i == 11 && crc32 !== undefined) {
            // Validate checksum
            // 12th byte is the high order byte of crc32
            if ( (data[i] & 0xFF) != (crc32 >>> 24) &&
                !this.invalidPassword(data.subarray(0,12), crc32) ) {
                return;
            }
        }
    }
    return data.subarray(12); // First 12 bytes are encryption header
};

/**
 * Updates a given CRC32 hash with an additional byte
 * @param {number} crc CRC32 hash as a 32-bit number
 * @param {number} b A single byte
 * @return {number} Updated CRC32 hash
 */
ZipCrypto.crc32Byte = function(crc, b) {
    var x = utils.crcTable[(crc ^ b) & 0xFF];
    return (crc >>> 8) ^ x;
};

/**
 * Updates encyption keys
 * @param {number[]} keys Encryption keys to be updated
 * @param {number} b A single byte
 */
function updateKeys(keys, b) {
    keys[0] = ZipCrypto.crc32Byte(keys[0], b);
    keys[1] = u32Multiply(keys[1] + (keys[0] & 0xFF), 0x08088405) + 1;
    keys[2] = ZipCrypto.crc32Byte(keys[2], keys[1] >> 24);
}

/**
 * Decrypts a single byte of data
 * @param {number[]} keys Encryption keys
 * @param {number} b A single byte
 * @return {number} Decrypted byte
 */
function decryptByte(keys, b) {
    var tmp = keys[2] | 2;
    b = b ^ (u32Multiply(tmp,tmp ^ 1) >> 8);
    updateKeys(keys, b);
    return b;
}

/**
 * Performs 32-bit multiplication.
 * Discards overflow bits and maintains accuracy for the low significance bits
 * @param {number} a
 * @param {number} b
 * @return 32-bit product of a and b
 */
function u32Multiply(a, b) {
    // We have a 52 bit mantissa, so we can safely multiply 32 bit and 16 bit
    //   numbers without losing accuracy (result cannot be more than 48 bits)
    var a1 = a >>> 16; // MSB 16 bits
    var a2 = a & 0xFFFF; // LSB 16 bits
    // a1 and a2 are always positive here
    b = b >>> 0; // Truncate MSBs past 32 bits
    
    return ( ( (b * a1) << 16 >>> 0) + b * a2 ) >>> 0; // Don't return negative numbers
}

module.exports = ZipCrypto;