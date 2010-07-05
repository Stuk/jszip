/**

JSZip - A Javascript class for generating Zip files
<http://jszip.stuartk.co.uk>

(c) 2009 Stuart Knightley <stuart [at] stuartk.co.uk>
Licenced under the GPLv3 and the MIT licences

Usage:
   zip = new JSZip();
   zip.add("hello.txt", "Hello, World!").add("tempfile", "nothing");
   zip.folder("images").add("smile.gif", base64Data, {base64: true});
   zip.add("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
   zip.remove("tempfile");

   base64zip = zip.generate();

**/

function JSZip(compression)
{
   // default : no compression
   this.compression = (compression || "STORE").toUpperCase();
   this.files = [];

   // Where we are in the hierarchy
   this.root = "";

   // Default properties for a new file
   this.d = {
      base64: false,
      binary: false,
      dir: false,
      date: null
   };

   if (!JSZip.compressions[this.compression]) {
      throw compression + " is not a valid compression method !";
   }
}

/**
 * Add a file to the zip file
 * @param   name  The name of the file
 * @param   data  The file data, either raw or base64 encoded
 * @param   o     File options
 * @return  this JSZip object
 */
JSZip.prototype.add = function(name, data, o)
{
   o = o || {};
   name = this.root+name;

   if (o.base64 === true && o.binary == null) o.binary = true;

   for (var opt in this.d)
   {
      o[opt] = o[opt] || this.d[opt];
   }

   // date
   // @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
   // @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
   // @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

   o.date = o.date || new Date();
   var dosTime, dosDate;

   dosTime = o.date.getHours();
   dosTime = dosTime << 6;
   dosTime = dosTime | o.date.getMinutes();
   dosTime = dosTime << 5;
   dosTime = dosTime | o.date.getSeconds() / 2;

   dosDate = o.date.getFullYear() - 1980;
   dosDate = dosDate << 4;
   dosDate = dosDate | (o.date.getMonth() + 1);
   dosDate = dosDate << 5;
   dosDate = dosDate | o.date.getDate();

   if (o.base64 === true) data = JSZipBase64.decode(data);
   // decode UTF-8 strings if we are dealing with text data
   if(o.binary === false) data = this.utf8encode(data);


   var compression    = JSZip.compressions[this.compression];
   var compressedData = compression.compress(data);

   var header = "";

   // version needed to extract
   header += "\x0A\x00";
   // general purpose bit flag
   header += "\x00\x00";
   // compression method
   header += compression.magic;
   // last mod file time
   header += this.decToHex(dosTime, 2);
   // last mod file date
   header += this.decToHex(dosDate, 2);
   // crc-32
   header += this.decToHex(this.crc32(data), 4);
   // compressed size
   header += this.decToHex(compressedData.length, 4);
   // uncompressed size
   header += this.decToHex(data.length, 4);
   // file name length
   header += this.decToHex(name.length, 2);
   // extra field length
   header += "\x00\x00";

   // file name

   this.files[name] = {header: header, data: compressedData, dir: o.dir};

   return this;
};

/**
 * Add a directory to the zip file
 * @param   name  The name of the directory to add
 * @return  JSZip object with the new directory as the root
 */
JSZip.prototype.folder = function(name)
{
   // Check the name ends with a /
   if (name.substr(-1) != "/") name += "/";

   // Does this folder already exist?
   if (typeof this.files[name] === "undefined") this.add(name, '', {dir:true});

   // Allow chaining by returning a new object with this folder as the root
   var ret = this.clone();
   ret.root = this.root+name;
   return ret;
};

/**
 * Compare a string or regular expression against all of the filenames and
 * return an informational object for each that matches.
 * @param   string/regex The regular expression to test against
 * @return  An array of objects representing the matched files. In the form
 *          {name: "filename", data: "file data", dir: true/false}
 */
JSZip.prototype.find = function(needle)
{
   var result = [], re;
   if (typeof needle === "string")
   {
      re = new RegExp("^"+needle+"$");
   }
   else
   {
      re = needle;
   }

   for (var filename in this.files)
   {
      if (re.test(filename))
      {
         var file = this.files[filename];
         result.push({name: filename, data: file.data, dir: !!file.dir});
      }
   }

   return result;
};

/**
 * Delete a file, or a directory and all sub-files, from the zip
 * @param   name  the name of the file to delete
 * @return  this JSZip object
 */
JSZip.prototype.remove = function(name)
{
   var file = this.files[name];
   if (!file)
   {
      // Look for any folders
      if (name.substr(-1) != "/") name += "/";
      file = this.files[name];
   }

   if (file)
   {
      if (name.match("/") === null)
      {
         // file
         delete this.files[name];
      }
      else
      {
         // folder
         var kids = this.find(new RegExp("^"+name));
         for (var i = 0; i < kids.length; i++)
         {
            if (kids[i].name == name)
            {
               // Delete this folder
               delete this.files[name];
            }
            else
            {
               // Remove a child of this folder
               this.remove(kids[i].name);
            }
         }
      }
   }

   return this;
};

/**
 * Generate the complete zip file
 * @return  A base64 encoded string of the zip file
 */
JSZip.prototype.generate = function(asBytes)
{
   asBytes = asBytes || false;

   // The central directory, and files data
   var directory = [], files = [], fileOffset = 0;

   for (var name in this.files)
   {
      if( !this.files.hasOwnProperty(name) ) { continue; }

      var fileRecord = "", dirRecord = "";
      fileRecord = "\x50\x4b\x03\x04" + this.files[name].header + name + this.files[name].data;

      dirRecord = "\x50\x4b\x01\x02" +
      // version made by (00: DOS)
      "\x14\x00" +
      // file header (common to file and central directory)
      this.files[name].header +
      // file comment length
      "\x00\x00" +
      // disk number start
      "\x00\x00" +
      // internal file attributes TODO
      "\x00\x00" +
      // external file attributes
      (this.files[name].dir===true?"\x10\x00\x00\x00":"\x00\x00\x00\x00")+
      // relative offset of local header
      this.decToHex(fileOffset, 4) +
      // file name
      name;

      fileOffset += fileRecord.length;

      files.push(fileRecord);
      directory.push(dirRecord);
   }

   var fileData = files.join("");
   var dirData = directory.join("");

   var dirEnd = "";

   // end of central dir signature
   dirEnd = "\x50\x4b\x05\x06" +
   // number of this disk
   "\x00\x00" +
   // number of the disk with the start of the central directory
   "\x00\x00" +
   // total number of entries in the central directory on this disk
   this.decToHex(files.length, 2) +
   // total number of entries in the central directory
   this.decToHex(files.length, 2) +
   // size of the central directory   4 bytes
   this.decToHex(dirData.length, 4) +
   // offset of start of central directory with respect to the starting disk number
   this.decToHex(fileData.length, 4) +
   // .ZIP file comment length
   "\x00\x00";

   var zip = fileData + dirData + dirEnd;
   return (asBytes) ? zip : JSZipBase64.encode(zip);

};

/*
 * Compression methods
 * This object is filled in as follow :
 * name : {
 *    magic // the 2 bytes indentifying the compression method
 *    compress // function, take the uncompressed content and return it compressed.
 * }
 *
 * STORE is the default compression method, so it's included in this file.
 * Other methods should go to separated files : the user wants modularity.
 */
JSZip.compressions = {
   "STORE" : {
      magic : "\x00\x00",
      compress : function (content) {
         return content; // no compression
      }
   }
};

// Utility functions

JSZip.prototype.decToHex = function(dec, bytes)
{
   var hex = "";
   for(var i=0;i<bytes;i++) {
      hex += String.fromCharCode(dec&0xff);
      dec=dec>>>8;
   }
   return hex;
};

/**
*
*  Javascript crc32
*  http://www.webtoolkit.info/
*
**/

JSZip.prototype.crc32 = function(str, crc)
{

   if (str === "") return "\x00\x00\x00\x00";

   var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";

   if (typeof(crc) == "undefined") { crc = 0; }
   var x = 0;
   var y = 0;

   crc = crc ^ (-1);
   for( var i = 0, iTop = str.length; i < iTop; i++ ) {
      y = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
      x = "0x" + table.substr( y * 9, 8 );
      crc = ( crc >>> 8 ) ^ x;
   }

   return crc ^ (-1);

};

// Inspired by http://my.opera.com/GreyWyvern/blog/show.dml/1725165
JSZip.prototype.clone = function()
{
   var newObj = new JSZip();
   for (var i in this)
   {
      if (typeof this[i] !== "function")
      {
         newObj[i] = this[i];
      }
   }
   return newObj;
};

JSZip.prototype.utf8encode = function(input)
{
   input = encodeURIComponent(input);
   input = input.replace(/%.{2,2}/g, function(m) {
      var hex = m.substring(1);
      return String.fromCharCode(parseInt(hex,16));
   });
   return input;
};

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
*  Hacked so that it doesn't utf8 en/decode everything
**/

var JSZipBase64 = function() {
   // private property
   var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

   return {
      // public method for encoding
      encode : function(input, utf8) {
         var output = "";
         var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
         var i = 0;

         while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
               enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
               enc4 = 64;
            }

            output = output +
            _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
            _keyStr.charAt(enc3) + _keyStr.charAt(enc4);

         }

         return output;
      },

      // public method for decoding
      decode : function(input, utf8) {
         var output = "";
         var chr1, chr2, chr3;
         var enc1, enc2, enc3, enc4;
         var i = 0;

         input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

         while (i < input.length) {

            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
               output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
               output = output + String.fromCharCode(chr3);
            }

         }

         return output;

      }
   };
}();
