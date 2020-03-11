'use strict';
var CryptoJS = require('crypto-js');
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
    decrypt:function(){
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
        }).toString();

        return new Uint8Array(decryptData.match(/.{1,2}/g).map(function(b){
            return parseInt(b, 16);
        }));
    }
};

module.exports = AesObject;