'use strict';
var CryptoJS = require('crypto-js/core');
require('crypto-js/lib-typedarrays');
require('crypto-js/aes');
require('crypto-js/pbkdf2');
require('crypto-js/hmac-sha1');
require('crypto-js/mode-ctr-gladman');
require('crypto-js/pad-nopadding');
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
var AesObject = function(data, password, options) {
    this.passwordVerifyLen = 2;
    this.data = data;
    this.version = options.version;
    this.strength = options.strength;
    this.password = password;
    this.saltLength = AesKeyStrength[this.strength].saltLength;
    this.macLength = AesKeyStrength[this.strength].macLength;
    this.keyLength = AesKeyStrength[this.strength].keyLength;
};
AesObject.prototype ={
    wordArrayToUint8Array: function(wordArray) {                                                                                       
        var l = wordArray.sigBytes;                                                                                                        
        var words = wordArray.words;                                                                                                       
        var result = new Uint8Array(l);                                                                                                    
        var i=0, j=0;
        while(true) {
            if (i==l)
                break;
            var w = words[j++];
            result[i++] = (w & 0xff000000) >>> 24;
            if (i==l)
                break;
            result[i++] = (w & 0x00ff0000) >>> 16;                                                                                            
            if (i==l)                                                                                                                        
                break;                                                                                                                       
            result[i++] = (w & 0x0000ff00) >>> 8;
            if (i==l)
                break;
            result[i++] = (w & 0x000000ff);                                                                                                  
        }
        return result
    },
    decrypt: function(){
        var salt = CryptoJS.lib.WordArray.create(this.data.slice(0,this.saltLength));
        var passVerifyValue = CryptoJS.lib.WordArray.create(this.data.slice(this.saltLength,this.saltLength + this.passwordVerifyLen)).toString(CryptoJS.enc.Hex);
        var encryptedData = CryptoJS.lib.WordArray.create(this.data.slice(this.saltLength + this.passwordVerifyLen, -10));
        var macData = CryptoJS.lib.WordArray.create(this.data.slice(-10)).toString(CryptoJS.enc.Hex);
        var derivedKey = CryptoJS.PBKDF2(this.password, salt,{
            keySize: (this.macLength + this.keyLength + this.passwordVerifyLen) / 4,
            iterations: 1000
        }).toString();
        var aesKey = CryptoJS.enc.Hex.parse(derivedKey.slice(0,this.keyLength * 2));
        var macKey = CryptoJS.enc.Hex.parse(derivedKey.slice(this.keyLength * 2, (this.keyLength + this.macLength) * 2));
        var derivedPasswordVerifier = derivedKey.slice(-this.passwordVerifyLen * 2);

        if(passVerifyValue !== derivedPasswordVerifier){
            throw new Error("Wrong Password!");
        }
        
        // if AE-2 format check mac
        if(this.version === 2){
            var macDataVerifier = CryptoJS.HmacSHA1(encryptedData,macKey).toString().slice(0,20);
            if(macData !== macDataVerifier){
                throw new Error("Corrupted encrypted data!");
            }
        }

        var decryptData = CryptoJS.AES.decrypt({
            ciphertext: encryptedData
        },aesKey,{
            iv: CryptoJS.enc.Hex.parse("0"),
            mode: CryptoJS.mode.CTRGladman,
            padding: CryptoJS.pad.NoPadding
        })

        return this.wordArrayToUint8Array(decryptData)
    }
};

module.exports = AesObject;
