/** @fileOverview Javascript cryptography implementation.
 *
 * Crush to remove comments, shorten variable names and
 * generally reduce transmission size.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

"use strict";
/*jslint indent: 2, bitwise: false, nomen: false, plusplus: false, white: false, regexp: false */
/*global document, window, escape, unescape, module, require, Uint32Array */

/**
 * The Stanford Javascript Crypto Library, top-level namespace.
 * @namespace
 */
var sjcl = {
    /**
     * Symmetric ciphers.
     * @namespace
     */
    cipher: {},

    /**
     * Hash functions.
     * @namespace
     */
    hash: {},

    /**
     * Key exchange functions.  Right now only SRP is implemented.
     * @namespace
     */
    keyexchange: {},

    /**
     * Cipher modes of operation.
     * @namespace
     */
    mode: {},

    /**
     * Miscellaneous.  HMAC and PBKDF2.
     * @namespace
     */
    misc: {},

    /**
     * Bit array encoders and decoders.
     * @namespace
     *
     * @description
     * The members of this namespace are functions which translate between
     * SJCL's bitArrays and other objects (usually strings).  Because it
     * isn't always clear which direction is encoding and which is decoding,
     * the method names are "fromBits" and "toBits".
     */
    codec: {},

    /**
     * Exceptions.
     * @namespace
     */
    exception: {
        /**
         * Ciphertext is corrupt.
         * @constructor
         */
        corrupt: function (message) {
            this.toString = function () { return "CORRUPT: " + this.message; };
            this.message = message;
        },

        /**
         * Invalid parameter.
         * @constructor
         */
        invalid: function (message) {
            this.toString = function () { return "INVALID: " + this.message; };
            this.message = message;
        },

        /**
         * Bug or missing feature in SJCL.
         * @constructor
         */
        bug: function (message) {
            this.toString = function () { return "BUG: " + this.message; };
            this.message = message;
        },

        /**
         * Something isn't ready.
         * @constructor
         */
        notReady: function (message) {
            this.toString = function () { return "NOT READY: " + this.message; };
            this.message = message;
        }
    }
};

/** @fileOverview Arrays of bits, encoded as arrays of Numbers.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/**
 * Arrays of bits, encoded as arrays of Numbers.
 * @namespace
 * @description
 * <p>
 * These objects are the currency accepted by SJCL's crypto functions.
 * </p>
 *
 * <p>
 * Most of our crypto primitives operate on arrays of 4-byte words internally,
 * but many of them can take arguments that are not a multiple of 4 bytes.
 * This library encodes arrays of bits (whose size need not be a multiple of 8
 * bits) as arrays of 32-bit words.  The bits are packed, big-endian, into an
 * array of words, 32 bits at a time.  Since the words are double-precision
 * floating point numbers, they fit some extra data.  We use this (in a private,
 * possibly-changing manner) to encode the number of bits actually  present
 * in the last word of the array.
 * </p>
 *
 * <p>
 * Because bitwise ops clear this out-of-band data, these arrays can be passed
 * to ciphers like AES which want arrays of words.
 * </p>
 */
sjcl.bitArray = {
    /**
     * Array slices in units of bits.
     * @param {bitArray} a The array to slice.
     * @param {Number} bstart The offset to the start of the slice, in bits.
     * @param {Number} bend The offset to the end of the slice, in bits.  If this is undefined,
     * slice until the end of the array.
     * @return {bitArray} The requested slice.
     */
    bitSlice: function (a, bstart, bend) {
        a = sjcl.bitArray._shiftRight(a.slice(bstart / 32), 32 - (bstart & 31)).slice(1);
        return (bend === undefined) ? a : sjcl.bitArray.clamp(a, bend - bstart);
    },

    /**
     * Concatenate two bit arrays.
     * @param {bitArray} a1 The first array.
     * @param {bitArray} a2 The second array.
     * @return {bitArray} The concatenation of a1 and a2.
     */
    concat: function (a1, a2) {
        if (a1.length === 0 || a2.length === 0) {
            return a1.concat(a2);
        }

        var last = a1[a1.length - 1], shift = sjcl.bitArray.getPartial(last);
        if (shift === 32) {
            return a1.concat(a2);
        } else {
            return sjcl.bitArray._shiftRight(a2, shift, last | 0, a1.slice(0, a1.length - 1));
        }
    },

    /**
     * Find the length of an array of bits.
     * @param {bitArray} a The array.
     * @return {Number} The length of a, in bits.
     */
    bitLength: function (a) {
        var l = a.length, x;
        if (l === 0) { return 0; }
        x = a[l - 1];
        return (l - 1) * 32 + sjcl.bitArray.getPartial(x);
    },

    /**
     * Truncate an array.
     * @param {bitArray} a The array.
     * @param {Number} len The length to truncate to, in bits.
     * @return {bitArray} A new array, truncated to len bits.
     */
    clamp: function (a, len) {
        if (a.length * 32 < len) { return a; }
        a = a.slice(0, Math.ceil(len / 32));
        var l = a.length;
        len = len & 31;
        if (l > 0 && len) {
            a[l - 1] = sjcl.bitArray.partial(len, a[l - 1] & 0x80000000 >> (len - 1), 1);
        }
        return a;
    },

    /**
     * Make a partial word for a bit array.
     * @param {Number} len The number of bits in the word.
     * @param {Number} x The bits.
     * @param {Number} [_end=0] Pass 1 if x has already been shifted to the high side.
     * @return {Number} The partial word.
     */
    partial: function (len, x, _end) {
        if (len === 32) { return x; }
        return (_end ? x | 0 : x << (32 - len)) + len * 0x10000000000;
    },

    /**
     * Get the number of bits used by a partial word.
     * @param {Number} x The partial word.
     * @return {Number} The number of bits used by the partial word.
     */
    getPartial: function (x) {
        return Math.round(x / 0x10000000000) || 32;
    },

    /**
     * Compare two arrays for equality in a predictable amount of time.
     * @param {bitArray} a The first array.
     * @param {bitArray} b The second array.
     * @return {boolean} true if a == b; false otherwise.
     */
    equal: function (a, b) {
        if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) {
            return false;
        }
        var x = 0, i;
        for (i = 0; i < a.length; i++) {
            x |= a[i] ^ b[i];
        }
        return (x === 0);
    },

    /** Shift an array right.
     * @param {bitArray} a The array to shift.
     * @param {Number} shift The number of bits to shift.
     * @param {Number} [carry=0] A byte to carry in
     * @param {bitArray} [out=[]] An array to prepend to the output.
     * @private
     */
    _shiftRight: function (a, shift, carry, out) {
        var i, last2 = 0, shift2;
        if (out === undefined) { out = []; }

        for (; shift >= 32; shift -= 32) {
            out.push(carry);
            carry = 0;
        }
        if (shift === 0) {
            return out.concat(a);
        }

        for (i = 0; i < a.length; i++) {
            out.push(carry | a[i] >>> shift);
            carry = a[i] << (32 - shift);
        }
        last2 = a.length ? a[a.length - 1] : 0;
        shift2 = sjcl.bitArray.getPartial(last2);
        out.push(sjcl.bitArray.partial(shift + shift2 & 31, (shift + shift2 > 32) ? carry : out.pop(), 1));
        return out;
    }
};

/** @fileOverview Bit array codec implementations.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/**
 * Arrays of bytes
 * @namespace
 */
sjcl.codec.bytes = {
    /** Convert from a bitArray to an array of bytes. */
    fromBits: function (arr) {
        var out = [], bl = sjcl.bitArray.bitLength(arr), i, tmp;
        for (i = 0; i < bl / 8; i++) {
            if ((i & 3) === 0) {
                tmp = arr[i / 4];
            }
            out.push(tmp >>> 24);
            tmp <<= 8;
        }
        return out;
    },
    /** Convert from an array of bytes to a bitArray. */
    toBits: function (bytes) {
        var out = [], i, tmp = 0;
        for (i = 0; i < bytes.length; i++) {
            tmp = tmp << 8 | bytes[i];
            if ((i & 3) === 3) {
                out.push(tmp);
                tmp = 0;
            }
        }
        if (i & 3) {
            out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
        }
        return out;
    }
};

/** @fileOverview Bit array codec implementations.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/**
 * UTF-8 strings
 * @namespace
 */
sjcl.codec.utf8String = {
    /** Convert from a bitArray to a UTF-8 string. */
    fromBits: function (arr) {
        var out = "", bl = sjcl.bitArray.bitLength(arr), i, tmp;
        for (i = 0; i < bl / 8; i++) {
            if ((i & 3) === 0) {
                tmp = arr[i / 4];
            }
            out += String.fromCharCode(tmp >>> 8 >>> 8 >>> 8);
            tmp <<= 8;
        }
        return decodeURIComponent(escape(out));
    },

    /** Convert from a UTF-8 string to a bitArray. */
    toBits: function (str) {
        str = unescape(encodeURIComponent(str));
        var out = [], i, tmp = 0;
        for (i = 0; i < str.length; i++) {
            tmp = tmp << 8 | str.charCodeAt(i);
            if ((i & 3) === 3) {
                out.push(tmp);
                tmp = 0;
            }
        }
        if (i & 3) {
            out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
        }
        return out;
    }
};

/** @fileOverview Javascript SHA-1 implementation.
 *
 * Based on the implementation in RFC 3174, method 1, and on the SJCL
 * SHA-256 implementation.
 *
 * @author Quinn Slack
 */

/**
 * Context for a SHA-1 operation in progress.
 * @constructor
 */
sjcl.hash.sha1 = function (hash) {
    if (hash) {
        this._h = hash._h.slice(0);
        this._buffer = hash._buffer.slice(0);
        this._length = hash._length;
    } else {
        this.reset();
    }
};

/**
 * Hash a string or an array of words.
 * @static
 * @param {bitArray|String} data the data to hash.
 * @return {bitArray} The hash value, an array of 5 big-endian words.
 */
sjcl.hash.sha1.hash = function (data) {
    return (new sjcl.hash.sha1()).update(data).finalize();
};

sjcl.hash.sha1.prototype = {
    /**
     * The hash's block size, in bits.
     * @constant
     */
    blockSize: 512,

    /**
     * Reset the hash state.
     * @return this
     */
    reset: function () {
        this._h = this._init.slice(0);
        this._buffer = [];
        this._length = 0;
        return this;
    },

    /**
     * Input several words to the hash.
     * @param {bitArray|String} data the data to hash.
     * @return this
     */
    update: function (data) {
        if (typeof data === "string") {
            data = sjcl.codec.utf8String.toBits(data);
        }
        var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
            ol = this._length,
            nl = this._length = ol + sjcl.bitArray.bitLength(data);
        if (nl > 9007199254740991) {
            throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
        }

        if (typeof Uint32Array !== 'undefined') {
            var c = new Uint32Array(b);
            var j = 0;
            for (i = this.blockSize + ol - ((this.blockSize + ol) & (this.blockSize - 1)); i <= nl;
                i += this.blockSize) {
                this._block(c.subarray(16 * j, 16 * (j + 1)));
                j += 1;
            }
            b.splice(0, 16 * j);
        } else {
            for (i = this.blockSize + ol - ((this.blockSize + ol) & (this.blockSize - 1)); i <= nl;
                i += this.blockSize) {
                this._block(b.splice(0, 16));
            }
        }
        return this;
    },

    /**
     * Complete hashing and output the hash value.
     * @return {bitArray} The hash value, an array of 5 big-endian words. TODO
     */
    finalize: function () {
        var i, b = this._buffer, h = this._h;

        // Round out and push the buffer
        b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
        // Round out the buffer to a multiple of 16 words, less the 2 length words.
        for (i = b.length + 2; i & 15; i++) {
            b.push(0);
        }

        // append the length
        b.push(Math.floor(this._length / 0x100000000));
        b.push(this._length | 0);

        while (b.length) {
            this._block(b.splice(0, 16));
        }

        this.reset();
        return h;
    },

    /**
     * The SHA-1 initialization vector.
     * @private
     */
    _init: [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0],

    /**
     * The SHA-1 hash key.
     * @private
     */
    _key: [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6],

    /**
     * The SHA-1 logical functions f(0), f(1), ..., f(79).
     * @private
     */
    _f: function (t, b, c, d) {
        if (t <= 19) {
            return (b & c) | (~b & d);
        } else if (t <= 39) {
            return b ^ c ^ d;
        } else if (t <= 59) {
            return (b & c) | (b & d) | (c & d);
        } else if (t <= 79) {
            return b ^ c ^ d;
        }
    },

    /**
     * Circular left-shift operator.
     * @private
     */
    _S: function (n, x) {
        return (x << n) | (x >>> 32 - n);
    },

    /**
     * Perform one cycle of SHA-1.
     * @param {Uint32Array|bitArray} words one block of words.
     * @private
     */
    _block: function (words) {
        var t, tmp, a, b, c, d, e,
            h = this._h;
        var w;
        if (typeof Uint32Array !== 'undefined') {
            // When words is passed to _block, it has 16 elements. SHA1 _block
            // function extends words with new elements (at the end there are 80 elements). 
            // The problem is that if we use Uint32Array instead of Array, 
            // the length of Uint32Array cannot be changed. Thus, we replace words with a 
            // normal Array here.
            w = Array(80); // do not use Uint32Array here as the instantiation is slower
            for (var j = 0; j < 16; j++) {
                w[j] = words[j];
            }
        } else {
            w = words;
        }

        a = h[0]; b = h[1]; c = h[2]; d = h[3]; e = h[4];

        for (t = 0; t <= 79; t++) {
            if (t >= 16) {
                w[t] = this._S(1, w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]);
            }
            tmp = (this._S(5, a) + this._f(t, b, c, d) + e + w[t] +
                this._key[Math.floor(t / 20)]) | 0;
            e = d;
            d = c;
            c = this._S(30, b);
            b = a;
            a = tmp;
        }

        h[0] = (h[0] + a) | 0;
        h[1] = (h[1] + b) | 0;
        h[2] = (h[2] + c) | 0;
        h[3] = (h[3] + d) | 0;
        h[4] = (h[4] + e) | 0;
    }
};

/** @fileOverview Low-level AES implementation.
 *
 * This file contains a low-level implementation of AES, optimized for
 * size and for efficiency on several browsers.  It is based on
 * OpenSSL's aes_core.c, a public-domain implementation by Vincent
 * Rijmen, Antoon Bosselaers and Paulo Barreto.
 *
 * An older version of this implementation is available in the public
 * domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
 * Stanford University 2008-2010 and BSD-licensed for liability
 * reasons.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/**
 * Schedule out an AES key for both encryption and decryption.  This
 * is a low-level class.  Use a cipher mode to do bulk encryption.
 *
 * @constructor
 * @param {Array} key The key as an array of 4, 6 or 8 words.
 */
sjcl.cipher.aes = function (key) {
    if (!this._tables[0][0][0]) {
        this._precompute();
    }

    var i, j, tmp,
        encKey, decKey,
        sbox = this._tables[0][4], decTable = this._tables[1],
        keyLen = key.length, rcon = 1;

    if (keyLen !== 4 && keyLen !== 6 && keyLen !== 8) {
        throw new sjcl.exception.invalid("invalid aes key size");
    }

    this._key = [encKey = key.slice(0), decKey = []];

    // schedule encryption keys
    for (i = keyLen; i < 4 * keyLen + 28; i++) {
        tmp = encKey[i - 1];

        // apply sbox
        if (i % keyLen === 0 || (keyLen === 8 && i % keyLen === 4)) {
            tmp = sbox[tmp >>> 24] << 24 ^ sbox[tmp >> 16 & 255] << 16 ^ sbox[tmp >> 8 & 255] << 8 ^ sbox[tmp & 255];

            // shift rows and add rcon
            if (i % keyLen === 0) {
                tmp = tmp << 8 ^ tmp >>> 24 ^ rcon << 24;
                rcon = rcon << 1 ^ (rcon >> 7) * 283;
            }
        }

        encKey[i] = encKey[i - keyLen] ^ tmp;
    }

    // schedule decryption keys
    for (j = 0; i; j++, i--) {
        tmp = encKey[j & 3 ? i : i - 4];
        if (i <= 4 || j < 4) {
            decKey[j] = tmp;
        } else {
            decKey[j] = decTable[0][sbox[tmp >>> 24]] ^
                decTable[1][sbox[tmp >> 16 & 255]] ^
                decTable[2][sbox[tmp >> 8 & 255]] ^
                decTable[3][sbox[tmp & 255]];
        }
    }
};

sjcl.cipher.aes.prototype = {
    // public
    /* Something like this might appear here eventually
    name: "AES",
    blockSize: 4,
    keySizes: [4,6,8],
    */

    /**
     * Encrypt an array of 4 big-endian words.
     * @param {Array} data The plaintext.
     * @return {Array} The ciphertext.
     */
    encrypt: function (data) { return this._crypt(data, 0); },

    /**
     * Decrypt an array of 4 big-endian words.
     * @param {Array} data The ciphertext.
     * @return {Array} The plaintext.
     */
    decrypt: function (data) { return this._crypt(data, 1); },

    /**
     * The expanded S-box and inverse S-box tables.  These will be computed
     * on the client so that we don't have to send them down the wire.
     *
     * There are two tables, _tables[0] is for encryption and
     * _tables[1] is for decryption.
     *
     * The first 4 sub-tables are the expanded S-box with MixColumns.  The
     * last (_tables[01][4]) is the S-box itself.
     *
     * @private
     */
    _tables: [[[], [], [], [], []], [[], [], [], [], []]],

    /**
     * Expand the S-box tables.
     *
     * @private
     */
    _precompute: function () {
        var encTable = this._tables[0], decTable = this._tables[1],
            sbox = encTable[4], sboxInv = decTable[4],
            i, x, xInv, d = [], th = [], x2, x4, x8, s, tEnc, tDec;

        // Compute double and third tables
        for (i = 0; i < 256; i++) {
            th[(d[i] = i << 1 ^ (i >> 7) * 283) ^ i] = i;
        }

        for (x = xInv = 0; !sbox[x]; x ^= x2 || 1, xInv = th[xInv] || 1) {
            // Compute sbox
            s = xInv ^ xInv << 1 ^ xInv << 2 ^ xInv << 3 ^ xInv << 4;
            s = s >> 8 ^ s & 255 ^ 99;
            sbox[x] = s;
            sboxInv[s] = x;

            // Compute MixColumns
            x8 = d[x4 = d[x2 = d[x]]];
            tDec = x8 * 0x1010101 ^ x4 * 0x10001 ^ x2 * 0x101 ^ x * 0x1010100;
            tEnc = d[s] * 0x101 ^ s * 0x1010100;

            for (i = 0; i < 4; i++) {
                encTable[i][x] = tEnc = tEnc << 24 ^ tEnc >>> 8;
                decTable[i][s] = tDec = tDec << 24 ^ tDec >>> 8;
            }
        }

        // Compactify.  Considerable speedup on Firefox.
        for (i = 0; i < 5; i++) {
            encTable[i] = encTable[i].slice(0);
            decTable[i] = decTable[i].slice(0);
        }
    },

    /**
     * Encryption and decryption core.
     * @param {Array} input Four words to be encrypted or decrypted.
     * @param dir The direction, 0 for encrypt and 1 for decrypt.
     * @return {Array} The four encrypted or decrypted words.
     * @private
     */
    _crypt: function (input, dir) {
        if (input.length !== 4) {
            throw new sjcl.exception.invalid("invalid aes block size");
        }

        var key = this._key[dir],
            // state variables a,b,c,d are loaded with pre-whitened data
            a = input[0] ^ key[0],
            b = input[dir ? 3 : 1] ^ key[1],
            c = input[2] ^ key[2],
            d = input[dir ? 1 : 3] ^ key[3],
            a2, b2, c2,

            nInnerRounds = key.length / 4 - 2,
            i,
            kIndex = 4,
            out = [0, 0, 0, 0],
            table = this._tables[dir],

            // load up the tables
            t0 = table[0],
            t1 = table[1],
            t2 = table[2],
            t3 = table[3],
            sbox = table[4];

        // Inner rounds.  Cribbed from OpenSSL.
        for (i = 0; i < nInnerRounds; i++) {
            a2 = t0[a >>> 24] ^ t1[b >> 16 & 255] ^ t2[c >> 8 & 255] ^ t3[d & 255] ^ key[kIndex];
            b2 = t0[b >>> 24] ^ t1[c >> 16 & 255] ^ t2[d >> 8 & 255] ^ t3[a & 255] ^ key[kIndex + 1];
            c2 = t0[c >>> 24] ^ t1[d >> 16 & 255] ^ t2[a >> 8 & 255] ^ t3[b & 255] ^ key[kIndex + 2];
            d = t0[d >>> 24] ^ t1[a >> 16 & 255] ^ t2[b >> 8 & 255] ^ t3[c & 255] ^ key[kIndex + 3];
            kIndex += 4;
            a = a2; b = b2; c = c2;
        }

        // Last round.
        for (i = 0; i < 4; i++) {
            out[dir ? 3 & -i : i] =
                sbox[a >>> 24] << 24 ^
                sbox[b >> 16 & 255] << 16 ^
                sbox[c >> 8 & 255] << 8 ^
                sbox[d & 255] ^
                key[kIndex++];
            a2 = a; a = b; b = c; c = d; d = a2;
        }

        return out;
    }
};

/** @fileOverview HMAC implementation.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/** HMAC with the specified hash function.
 * @constructor
 * @param {bitArray} key the key for HMAC.
 * @param {Object} [Hash=sjcl.hash.sha1] The hash function to use.
 */
sjcl.misc.hmac = function (key, Hash) {
    this._hash = Hash = Hash || sjcl.hash.sha1;
    var exKey = [[], []], i,
        bs = Hash.prototype.blockSize / 32;
    this._baseHash = [new Hash(), new Hash()];

    if (key.length > bs) {
        key = Hash.hash(key);
    }

    for (i = 0; i < bs; i++) {
        exKey[0][i] = key[i] ^ 0x36363636;
        exKey[1][i] = key[i] ^ 0x5C5C5C5C;
    }

    this._baseHash[0].update(exKey[0]);
    this._baseHash[1].update(exKey[1]);
    this._resultHash = new Hash(this._baseHash[0]);
};

/** HMAC with the specified hash function.  Also called encrypt since it's a prf.
 * @param {bitArray|String} data The data to mac.
 */
sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function (data) {
    if (!this._updated) {
        this.update(data);
        return this.digest(data);
    } else {
        throw new sjcl.exception.invalid("encrypt on already updated hmac called!");
    }
};

sjcl.misc.hmac.prototype.reset = function () {
    this._resultHash = new this._hash(this._baseHash[0]);
    this._updated = false;
};

sjcl.misc.hmac.prototype.update = function (data) {
    this._updated = true;
    this._resultHash.update(data);
};

sjcl.misc.hmac.prototype.digest = function () {
    var w = this._resultHash.finalize(), result = new (this._hash)(this._baseHash[1]).update(w).finalize();

    this.reset();

    return result;
};

/** @fileOverview Password-based key-derivation function, version 2.0.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/** Password-Based Key-Derivation Function, version 2.0.
 *
 * Generate keys from passwords using PBKDF2-HMAC-SHA1.
 *
 * This is the method specified by RSA's PKCS #5 standard.
 *
 * @param {bitArray|String} password  The password.
 * @param {bitArray|String} salt The salt.  Should have lots of entropy.
 * @param {Number} [count=1000] The number of iterations.  Higher numbers make the function slower but more secure.
 * @param {Number} [length] The length of the derived key.  Defaults to the
                            output size of the hash function.
 * @param {Object} [Prff=sjcl.misc.hmac] The pseudorandom function family.
 * @return {bitArray} the derived key.
 */
sjcl.misc.pbkdf2 = function (password, salt, count, length, Prff) {
    count = count || 10000;

    if (length < 0 || count < 0) {
        throw new sjcl.exception.invalid("invalid params to pbkdf2");
    }

    if (typeof password === "string") {
        password = sjcl.codec.utf8String.toBits(password);
    }

    if (typeof salt === "string") {
        salt = sjcl.codec.utf8String.toBits(salt);
    }

    Prff = Prff || sjcl.misc.hmac;

    var prf = new Prff(password),
        u, ui, i, j, k, out = [], b = sjcl.bitArray;

    for (k = 1; 32 * out.length < (length || 1); k++) {
        u = ui = prf.encrypt(b.concat(salt, [k]));

        for (i = 1; i < count; i++) {
            ui = prf.encrypt(ui);
            for (j = 0; j < ui.length; j++) {
                u[j] ^= ui[j];
            }
        }

        out = out.concat(u);
    }

    if (length) { out = b.clamp(out, length); }

    return out;
};

/**
 * Random values
 * @namespace
 */
sjcl.random = {
    /**
     * Generate cryptographically strong random words using native crypto module if it exists.
     * 
     * In react-native or other non native crypto environment, user could define a crypto module from gloabl variable.
     * 
     * If the crypto module doesn't exist, then using pure js implementation function.
     * 
     * @param {Number} nbytes The number of bytes to generate.
     * @return {bitArray} The random words.
     */
    randomWords: function (nbytes) {
        function getCryptoModule() {
            try {
                return require('crypto');
            }
            catch (e) {
                return null;
            }
        }

        var crypto;
        if (typeof window !== 'undefined') {
            // Native crypto from window (Browser)
            if (window.crypto) {
                crypto = window.crypto;
            }else if(window.msCrypto) {
                crypto = window.msCrypto;
            }
        } else if (typeof self !== 'undefined' && self.crypto) {
            // Native crypto from web worker (Browser)
            crypto = self.crypto;
        } else if (typeof module !== 'undefined' && module.exports) {
            // Native crypto import from NodeJS
            crypto = getCryptoModule();
        } else if (typeof global !== 'undefined' && global.crypto) {
            // Native crypto from global variable
            crypto = global.crypto;
        }

        // Get cryptographically strong random values depending on runtime environment
        try {
            if (crypto) {
                if (crypto.getRandomValues) {
                    return sjcl.codec.bytes.toBits(crypto.getRandomValues(new Uint8Array(nbytes)));
                }
                if (crypto.randomBytes) {
                    return sjcl.codec.bytes.toBits(new Uint8Array(crypto.randomBytes(nbytes)));
                }
            } else {
                return getRandomValues(nbytes);
            }
        } catch (e) {
            return getRandomValues(nbytes);
        }
    },
    
    /** 
     * Generate random words with pure js, cryptographically not as strong & safe as native implementation.
     * @param {Number} nbytes The number of bytes to generate.
     * @return {bitArray} The random words.
     */
    getRandomValues: function (nbytes) {
        var words = [];

        var r = function (m_w) {
            var m_w = m_w;
            var m_z = 0x3ade68b1;
            var mask = 0xffffffff;

            return function () {
                m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
                m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
                var result = ((m_z << 0x10) + m_w) & mask;
                result /= 0x100000000;
                result += 0.5;
                return result * (Math.random() > .5 ? 1 : -1);
            }
        };

        for (var i = 0, rcache; i < nbytes; i += 4) {
            var _r = r((rcache || Math.random()) * 0x100000000);
            rcache = _r() * 0x3ade67b7;
            words.push((_r() * 0x100000000) | 0);
        }

        return words
    }
}

/** @fileOverview CTR mode implementation.
 *
 * Special thanks to Roy Nicholson for pointing out a bug in our
 * implementation.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

 /** Brian Gladman's CTR Mode.
 * @constructor
 * @param {Object} _prf The aes instance to generate key.
 * @param {bitArray} _iv The iv for ctr mode, it must be 128 bits.
 */
/**
 * Brian Gladman's CTR Mode.
 * @namespace
 */
sjcl.mode.ctrGladman = function(prf, iv) {
    this._prf = prf;
    this._initIv = iv;
    this._iv = iv;
};

sjcl.mode.ctrGladman.prototype.reset = function () {
    this._iv = this._initIv;
}

/** Input some data to calculate.
 * @param {bitArray} data the data to process, it must be intergral multiple of 128 bits unless it's the last.
 */
sjcl.mode.ctrGladman.prototype.update = function (data) {
    return this.calculate(this._prf, data, this._iv);
}

sjcl.mode.ctrGladman.incWord =  function (word) {
    if (((word >> 24) & 0xff) === 0xff) { //overflow
        var b1 = (word >> 16) & 0xff;
        var b2 = (word >> 8) & 0xff;
        var b3 = word & 0xff;

        if (b1 === 0xff) { // overflow b1   
            b1 = 0;
            if (b2 === 0xff) {
                b2 = 0;
                if (b3 === 0xff) {
                    b3 = 0;
                } else {
                    ++b3;
                }
            } else {
                ++b2;
            }
        } else {
            ++b1;
        }

        word = 0;
        word += (b1 << 16);
        word += (b2 << 8);
        word += b3;
    } else {
        word += (0x01 << 24);
    }
    return word;
};

sjcl.mode.ctrGladman.incCounter = function (counter) {
    if ((counter[0] = sjcl.mode.ctrGladman.incWord(counter[0])) === 0) {
        // encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
        counter[1] = sjcl.mode.ctrGladman.incWord(counter[1]);
    }
};

sjcl.mode.ctrGladman.prototype.calculate = function (prf, data, iv) {
    var l, bl, e, i;
    if (!(l = data.length)) {
        return [];
    }
    bl = sjcl.bitArray.bitLength(data);
    for (i = 0; i < l; i += 4) {
        sjcl.mode.ctrGladman.incCounter(iv);
        e = prf.encrypt(iv);
        data[i] ^= e[0];
        data[i + 1] ^= e[1];
        data[i + 2] ^= e[2];
        data[i + 3] ^= e[3];
    }
    return sjcl.bitArray.clamp(data, bl);
}

module.exports = sjcl;
