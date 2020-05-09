/** @fileOverview CTR mode implementation.
 *
 * Special thanks to Roy Nicholson for pointing out a bug in our
 * implementation.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/**
 * CTR mode with CBC MAC.
 * @namespace
 */
sjcl.mode.ctrGladman = {
  /** The name of the mode.
   * @constant
   */
  name: "ctrGladman",
  
  /** Encrypt in CTR mode.
   * @param {Object} prf The pseudorandom function.  It must have a block size of 16 bytes.
   * @param {bitArray} plaintext The plaintext data.
   * @param {bitArray} iv The initialization value.  It must be 128 bits.
   * @param {bitArray} [adata=[]] The authenticated data.  Must be empty.
   * @return The encrypted data, an array of bytes.
   * @throws {sjcl.exception.invalid} if the IV isn't exactly 128 bits or if any adata is specified.
   */
  encrypt: function(prf, plaintext, iv, adata) {
    return sjcl.mode.ctrGladman._calculate(prf, plaintext, iv, adata);
  },

  /** Decrypt in CTR mode.
   * @param {Object} prf The pseudorandom function.  It must have a block size of 16 bytes.
   * @param {bitArray} ciphertext The ciphertext data.
   * @param {bitArray} iv The initialization value.  It must be 128 bits.
   * @param {bitArray} [adata=[]] The authenticated data.  It must be empty.
   * @return The decrypted data, an array of bytes.
   * @throws {sjcl.exception.invalid} if the IV isn't exactly 128 bits or if any adata is specified.
   * @throws {sjcl.exception.corrupt} if if the message is corrupt.
   */
  decrypt: function(prf, ciphertext, iv, adata) {
    return sjcl.mode.ctrGladman._calculate(prf, ciphertext, iv, adata);
  },

  incWord: function(word) {	
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
	},

	incCounter: function(counter) {
		if ((counter[0] = this.incWord(counter[0])) === 0)
		{
			// encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
			counter[1] = this.incWord(counter[1]);
		}
		return counter;
	},

  _calculate: function(prf, data, iv, adata) {
    var l, bl, res, c, d, e, i;
    if (adata && adata.length) {
      throw new sjcl.exception.invalid("ctr can't authenticate data");
    }
    if (sjcl.bitArray.bitLength(iv) !== 128) {
      throw new sjcl.exception.invalid("ctr iv must be 128 bits");
    }
    if (!(l = data.length)) {
      return [];
    }
    c = iv.slice(0);
    d = data.slice(0);
    bl = sjcl.bitArray.bitLength(d);
    for (i=0; i<l; i+=4) {
      this.incCounter(c);
      e = prf.encrypt(c);
      d[i] ^= e[0];
      d[i+1] ^= e[1];
      d[i+2] ^= e[2];
      d[i+3] ^= e[3];
    }
    return sjcl.bitArray.clamp(d, bl);
  }
};
