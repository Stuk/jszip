'use strict';
var sjcl = require('./sjcl');

/**
 * Process(encrypt or decrypt) aes data.
 * @param {String} action the process action name: either "Encrypt" or "Decrypt".
 * @param {Uint8Array} data the data to process.
 * @param {Object} options the options to use when (en/de)crypting.
 * @return {Uint8Array} the processed data.
 */
function processData(action, data, options) {
    var password = options.password;
    var keyLen = 8 * options.strength + 8;
    var macLen = keyLen;
    var saltLen = keyLen / 2;
    var version = options.version;
    var passwordVerifierLen = 2;
    var hmac;
    var iv = [0, 0, 0, 0];

    var salt = action === "Encrypt" ?
        sjcl.random.randomWords(saltLen / 4) :
        sjcl.codec.bytes.toBits(data.slice(0, saltLen));
    var derivedKey = sjcl.misc.pbkdf2(password, salt, 1000, (macLen + keyLen + passwordVerifierLen) * 8, sjcl.misc.hmac);

    var aesKey = sjcl.bitArray.bitSlice(derivedKey, 0, keyLen * 8);
    var macKey = sjcl.bitArray.bitSlice(derivedKey, keyLen * 8, (keyLen + macLen) * 8);
    var derivedPassVerifier = sjcl.bitArray.bitSlice(derivedKey, (keyLen + macLen) * 8);

    if (action === "Encrypt") {
        var encryptedData = sjcl.mode.ctrGladman.encrypt(new sjcl.cipher.aes(aesKey), sjcl.codec.bytes.toBits(data), iv);
        encryptedData = sjcl.bitArray.clamp(encryptedData, (data.length) * 8);

        hmac = new sjcl.misc.hmac(macKey);
        var macData = hmac.encrypt(encryptedData);
        macData = sjcl.bitArray.clamp(macData, 10 * 8);

        var fileData = sjcl.bitArray.concat(salt, derivedPassVerifier);
        fileData = sjcl.bitArray.concat(fileData, encryptedData);
        fileData = sjcl.bitArray.concat(fileData, macData);
        return new Uint8Array(sjcl.codec.bytes.fromBits(fileData));
    } else {
        var passVerifyValue = sjcl.codec.bytes.toBits(data.slice(saltLen, saltLen + passwordVerifierLen));
        if (!sjcl.bitArray.equal(passVerifyValue, derivedPassVerifier)) {
            throw new Error("Encrypted zip: incorrect password");
        }

        var encryptedValue = sjcl.codec.bytes.toBits(data.slice(saltLen + passwordVerifierLen, -10));
        var macValue = sjcl.codec.bytes.toBits(data.slice(-10));
        // if AE-2 format check mac
        if (version === 2) {
            hmac = new sjcl.misc.hmac(macKey);
            var macVerifier = hmac.encrypt(encryptedValue);
            macVerifier = sjcl.bitArray.clamp(macVerifier, 10 * 8);
            if (!sjcl.bitArray.equal(macValue, macVerifier)) {
                throw new Error("Corrupted zip: CRC failed");
            }
        }

        var decryptData = sjcl.mode.ctrGladman.decrypt(new sjcl.cipher.aes(aesKey), encryptedValue, iv);
        return new Uint8Array(sjcl.codec.bytes.fromBits(decryptData));
    }
}

exports.encryptData = function (data, options) {
    return processData("Encrypt", data, options);
};
exports.decryptData = function (data, options) {
    return processData("Decrypt", data, options);
};
