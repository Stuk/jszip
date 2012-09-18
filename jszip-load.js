/**

JSZip - A Javascript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2011 David Duponchel <d.duponchel@gmail.com>
Dual licenced under the MIT license or GPLv3. See LICENSE.markdown.

**/
/*global JSZip,JSZipBase64 */
(function () {

   /**
    * Prettify a string read as binary.
    * @param {string} str the string to prettify.
    * @return {string} a pretty string.
    */
   var pretty = function (str) {
      var res = '', code, i;
      for (i = 0; i < str.length; i++)
      {
         code = str.charCodeAt(i);
         res += '\\x' + (code < 10 ? "0" : "") + code.toString(16);
      }
      return res;
   };

   /**
    * Find a compression registered in JSZip.
    * @param {string} compressionMethod the method magic to find.
    * @return {Object|null} the JSZip compression object, null if none found.
    */
   var findCompression = function (compressionMethod) {
      for (var method in JSZip.compressions)
      {
         if (JSZip.compressions[method].magic === compressionMethod)
         {
            return JSZip.compressions[method];
         }
      }
      return null;
   };

   // class StreamReader {{{
   /**
    * Read bytes from a stream.
    * @constructor
    * @param {string} stream the stream to read.
    */
   function StreamReader(stream) {
      this.stream = stream;
      this.index = 0;
   }
   StreamReader.prototype = {
      /**
       * Check that the offset will not go too far.
       * @param {string} offset the additional offset to check.
       * @throws {Error} an Error if the offset is out of bounds.
       */
      checkOffset : function (offset)
      {
         this.checkIndex(this.index + offset);
      },
      /**
       * Check that the specifed index will not be too far.
       * @param {string} newIndex the index to check.
       * @throws {Error} an Error if the index is out of bounds.
       */
      checkIndex : function (newIndex)
      {
         if (this.stream.length < newIndex || newIndex < 0)
         {
            throw new Error("End of stream reached (stream length = " +
                            this.stream.length + ", asked index = " +
                            (newIndex) + "). Corrupted zip ?");
         }
      },
      /**
       * Change the index.
       * @param {number} newIndex The new index.
       * @throws {Error} if the new index is out of the stream.
       */
      setIndex : function (newIndex)
      {
         this.checkIndex(newIndex);
         this.index = newIndex;
      },
      /**
       * Check if the end of the file has been reached.
       * @return {boolean} true if it is the case, false otherwise.
       */
      eof : function ()
      {
         return this.index >= this.stream.length;
      },
      /**
       * Get the byte at the specified index.
       * @param {number} i the index to use.
       * @return {number} a byte.
       */
      byteAt : function(i)
      {
         return this.stream.charCodeAt(i) & 0xff;
      },
      /**
       * Get the next byte of this stream.
       * @return {string} the next byte.
       */
      readByte : function ()
      {
         this.checkOffset(1);
         return this.byteAt(1 + this.index++);
      },
      /**
       * Get the next number with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {number} the corresponding number.
       */
      readInt : function (size)
      {
         var result = 0, i;
         this.checkOffset(size);
         for(i = size - 1; i >= 0; i--)
         {
            result = (result << 8) + this.byteAt(this.index + i);
         }
         this.index += size;
         return result;
      },
      /**
       * Get the next string with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {string} the corresponding string.
       */
      readString : function (size)
      {
         var result = "", i, code;
         this.checkOffset(size);
         for(i = 0; i < size; i++)
         {
            code = this.byteAt(this.index + i);
            result += String.fromCharCode(code);
         }
         this.index += size;
         return result;
      },
      /**
       * Get the next date.
       * @return {Date} the date.
       */
      readDate : function ()
      {
         var dostime = this.readInt(4);
         return new Date(
            ((dostime >> 25) & 0x7f) + 1980, // year
            ((dostime >> 21) & 0x0f) - 1, // month
            (dostime >> 16) & 0x1f, // day
            (dostime >> 11) & 0x1f, // hour
            (dostime >> 5) & 0x3f, // minute
            (dostime & 0x1f) << 1); // second
      }
   };
   // }}} end of StreamReader

   // class ZipEntry {{{
   /**
    * An entry in the zip file.
    * @constructor
    * @param {Object} options Options of the current file.
    * @param {Object} loadOptions Options for loading the stream.
    */
   function ZipEntry(options, loadOptions) {
      this.options = options;
      this.loadOptions = loadOptions;
   }
   ZipEntry.prototype = {
      /**
       * say if the file is encrypted.
       * @return {boolean} true if the file is encrypted, false otherwise.
       */
      isEncrypted : function ()
      {
         // bit 1 is set
         return (this.bitFlag & 0x0001) === 0x0001;
      },
      /**
       * say if the file has a data decriptor.
       * @return {boolean} true if the file has a data descriptor, false otherwise.
       */
      hasDataDescriptor : function ()
      {
         // bit 3 is set
         return (this.bitFlag & 0x0008) === 0x0008;
      },
      /**
       * say if the file has utf-8 filename/comment.
       * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
       */
      useUTF8 : function ()
      {
         // bit 11 is set
         return (this.bitFlag & 0x0800) === 0x0800;
      },
      /**
       * say if the file is a zip64 file.
       * @return {boolean} true if the file is zip64, false otherwise.
       */
      isZIP64 : function ()
      {
         return this.options.zip64;
      },
      /**
       * Read the local part header of a zip file and add the info in this object.
       * @param {StreamReader} reader the reader to use.
       */
      readLocalPartHeader : function(reader)
      {
         // the signature has already been consumed
         this.versionNeeded     = reader.readInt(2);
         this.bitFlag           = reader.readInt(2);
         this.compressionMethod = reader.readString(2);
         this.date              = reader.readDate();
         this.crc32             = reader.readInt(4);
         this.compressedSize    = reader.readInt(4);
         this.uncompressedSize  = reader.readInt(4);
         this.fileNameLength    = reader.readInt(2);
         this.extraFieldsLength = reader.readInt(2);

         if (this.isEncrypted())
         {
            throw new Error("Encrypted zip are not supported");
         }
      },
      /**
       * Read the local part of a zip file and add the info in this object.
       * @param {StreamReader} reader the reader to use.
       */
      readLocalPart : function(reader)
      {
         var compression;

         this.readLocalPartHeader(reader);

         this.fileName = reader.readString(this.fileNameLength);
         this.readExtraFields(reader);

         if (!this.hasDataDescriptor())
         {
            // easy : we know the file length
            this.compressedFileData = reader.readString(this.compressedSize);
         }
         else
         {
            // hard way : find the data descriptor manually
            this.compressedFileData = this.findDataUntilDataDescriptor(reader);
            this.crc32              = reader.readInt(4);
            this.compressedSize     = reader.readInt(this.isZIP64() ? 8 : 4);
            this.uncompressedSize   = reader.readInt(this.isZIP64() ? 8 : 4);

            if (this.compressedFileData.length !== this.compressedSize)
            {
               throw new Error("Bug : data descriptor incorrectly read (size mismatch)");
            }
         }
         this.uncompressedFileData = null;

         compression = findCompression(this.compressionMethod);
         if (compression === null) // no compression found
         {
            throw new Error("Corrupted zip : compression " + pretty(this.compressionMethod) +
                            " unknown (inner file : " + this.fileName + ")");
         }
         this.uncompressedFileData = compression.uncompress(this.compressedFileData);

         if (this.loadOptions.checkCRC32 && JSZip.prototype.crc32(this.uncompressedFileData) !== this.crc32)
         {
            throw new Error("Corrupted zip : CRC32 mismatch");
         }

         if (this.useUTF8())
         {
            this.fileName = JSZip.prototype.utf8decode(this.fileName);
         }
      },

      /**
       * Read data until a data descriptor signature is found.
       * @param {StreamReader} reader the reader to use.
       */
      findDataUntilDataDescriptor : function(reader)
      {
         var data = "",
         buffer = reader.readString(4),
         aByte;

         while(buffer !== JSZip.signature.DATA_DESCRIPTOR)
         {
            aByte = reader.readString(1);
            data += buffer.slice(0, 1);
            buffer = (buffer + aByte).slice(-4);
         }
         return data;
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {StreamReader} reader the reader to use.
       */
      readCentralPart : function(reader)
      {
         this.versionMadeBy = reader.readString(2);

         this.readLocalPartHeader(reader);

         this.fileCommentLength      = reader.readInt(2);
         this.diskNumberStart        = reader.readInt(2);
         this.internalFileAttributes = reader.readInt(2);
         this.externalFileAttributes = reader.readInt(4);
         this.localHeaderOffset      = reader.readInt(4);

         this.fileName = reader.readString(this.fileNameLength);
         this.readExtraFields(reader);
         this.fileComment = reader.readString(this.fileCommentLength);
         if (this.useUTF8())
         {
            this.fileName    = JSZip.prototype.utf8decode(this.fileName);
            this.fileComment = JSZip.prototype.utf8decode(this.fileComment);
         }

         // warning, this is true only for zip with madeBy == DOS (plateform dependent feature)
         this.dir = this.externalFileAttributes & 0x00000010 ? true : false;
      },
      /**
       * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
       * @param {StreamReader} reader the reader to use.
       */
      parseZIP64ExtraField : function(reader)
      {
         // should be something, preparing the extra reader
         var extraReader = new StreamReader(this.extraFields[0x0001].value);
         if(this.uncompressedSize === -1)
         {
            this.uncompressedSize = extraReader.readInt(8);
         }
         if(this.compressedSize === -1)
         {
            this.compressedSize = extraReader.readInt(8);
         }
         if(this.localHeaderOffset === -1)
         {
            this.localHeaderOffset = extraReader.readInt(8);
         }
         if(this.diskNumberStart === -1)
         {
            this.diskNumberStart = extraReader.readInt(4);
         }
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {StreamReader} reader the reader to use.
       */
      readExtraFields : function(reader)
      {
         var start = reader.index,
             extraFieldId,
             extraFieldLength,
             extraFieldValue;

         this.extraFields = this.extraFields || {};

         while (reader.index < start + this.extraFieldsLength)
         {
            extraFieldId     = reader.readInt(2);
            extraFieldLength = reader.readInt(2);
            extraFieldValue  = reader.readString(extraFieldLength);

            this.extraFields[extraFieldId] = {
               id:     extraFieldId,
               length: extraFieldLength,
               value:  extraFieldValue
            };
         }

         if(this.isZIP64() && this.extraFields[0x0001])
         {
            this.parseZIP64ExtraField(reader);
         }
      }
   };
   // }}} end of ZipEntry

   //  class ZipEntries {{{
   /**
    * All the entries in the zip file.
    * @constructor
    * @param {string} data the binary stream to load.
    * @param {Object} loadOptions Options for loading the stream.
    */
   function ZipEntries(data, loadOptions) {
      this.files = [];
      this.loadOptions = loadOptions;
      if (data) {
         this.load(data);
      }
   }
   ZipEntries.prototype = {
      /**
       * Check that the reader is on the speficied signature.
       * @param {string} expectedSignature the expected signature.
       * @throws {Error} if it is an other signature.
       */
      checkSignature : function(expectedSignature)
      {
         var signature = this.reader.readString(4);
         if (signature !== expectedSignature)
         {
            throw new Error("Corrupted zip or bug : unexpected signature " +
                            "(" + pretty(signature) + ", expected " + pretty(expectedSignature) + ")");
         }
      },
      /**
       * Read the end of the central directory.
       */
      readBlockEndOfCentral : function ()
      {
         this.diskNumber                  = this.reader.readInt(2);
         this.diskWithCentralDirStart     = this.reader.readInt(2);
         this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
         this.centralDirRecords           = this.reader.readInt(2);
         this.centralDirSize              = this.reader.readInt(4);
         this.centralDirOffset            = this.reader.readInt(4);

         this.zipCommentLength            = this.reader.readInt(2);
         this.zipComment                  = this.reader.readString(this.zipCommentLength);
      },
      /**
       * Read the end of the Zip 64 central directory.
       * Not merged with the method readEndOfCentral :
       * The end of central can coexist with its Zip64 brother,
       * I don't want to read the wrong number of bytes !
       */
      readBlockZip64EndOfCentral : function ()
      {
         this.zip64EndOfCentralSize       = this.reader.readInt(8);
         this.versionMadeBy               = this.reader.readString(2);
         this.versionNeeded               = this.reader.readInt(2);
         this.diskNumber                  = this.reader.readInt(4);
         this.diskWithCentralDirStart     = this.reader.readInt(4);
         this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
         this.centralDirRecords           = this.reader.readInt(8);
         this.centralDirSize              = this.reader.readInt(8);
         this.centralDirOffset            = this.reader.readInt(8);

         this.zip64ExtensibleData = {};
         var extraDataSize = this.zip64EndOfCentralSize - 44,
         index = 0,
         extraFieldId,
         extraFieldLength,
         extraFieldValue;
         while(index < extraDataSize)
         {
            extraFieldId     = this.reader.readInt(2);
            extraFieldLength = this.reader.readInt(4);
            extraFieldValue  = this.reader.readString(extraFieldLength);
            this.zip64ExtensibleData[extraFieldId] = {
               id:     extraFieldId,
               length: extraFieldLength,
               value:  extraFieldValue
            };
         }
      },
      /**
       * Read the end of the Zip 64 central directory locator.
       */
      readBlockZip64EndOfCentralLocator : function ()
      {
         this.diskWithZip64CentralDirStart       = this.reader.readInt(4);
         this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
         this.disksCount                         = this.reader.readInt(4);
         if (this.disksCount > 1)
         {
            throw new Error("Multi-volumes zip are not supported");
         }
      },
      /**
       * Read the local files, based on the offset read in the central part.
       */
      readLocalFiles : function()
      {
         var i, file;
         for(i = 0; i < this.files.length; i++)
         {
            file = this.files[i];
            this.reader.setIndex(file.localHeaderOffset);
            this.checkSignature(JSZip.signature.LOCAL_FILE_HEADER);
            file.readLocalPart(this.reader);
         }
      },
      /**
       * Read the central directory.
       */
      readCentralDir : function()
      {
         var file;

         this.reader.setIndex(this.centralDirOffset);
         while(this.reader.readString(4) === JSZip.signature.CENTRAL_FILE_HEADER)
         {
            file = new ZipEntry({
               zip64: this.zip64
            }, this.loadOptions);
            file.readCentralPart(this.reader);
            this.files.push(file);
         }
      },
      /**
       * Read the end of central directory.
       */
      readEndOfCentral : function()
      {
         // zip 64 ?
         var offset = this.reader.stream.lastIndexOf(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
         if (offset === -1) // nope
         {
            this.zip64 = false;
            offset = this.reader.stream.lastIndexOf(JSZip.signature.CENTRAL_DIRECTORY_END);
            if (offset === -1)
            {
               throw new Error("Corrupted zip : can't find end of central directory");
            }

            this.reader.setIndex(offset);
            this.checkSignature(JSZip.signature.CENTRAL_DIRECTORY_END);
            this.readBlockEndOfCentral();
         }
         else // zip 64 !
         {
            this.zip64 = true;
            this.reader.setIndex(offset);
            this.checkSignature(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
            this.readBlockZip64EndOfCentralLocator();

            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
            this.checkSignature(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_END);
            this.readBlockZip64EndOfCentral();
         }
      },
      /**
       * Read a zip file and create ZipEntries.
       * @param {string} data the binary string representing a zip file.
       */
      load : function(data)
      {
         this.reader = new StreamReader(data);

         this.readEndOfCentral();
         this.readCentralDir();
         this.readLocalFiles();
      }
   };
   // }}} end of ZipEntries

   /**
    * Implementation of the load method of JSZip.
    * It uses the above classes to decode a zip file, and load every files.
    * @param {string} data the data to load.
    * @param {Object} options Options for loading the stream.
    *  options.base64 : is the stream in base64 ? default : false
    */
   JSZip.prototype.load = function(data, options) {
      var files, zipEntries, i, input;
      options = options || {};
      if(options.base64)
      {
         data = JSZipBase64.decode(data);
      }

      zipEntries = new ZipEntries(data, options);
      files = zipEntries.files;
      for (i in files)
      {
         input = files[i];
         this.file(input.fileName, input.uncompressedFileData, {
            binary:true,
            date:input.date,
            dir:input.dir
         });
      }

      return this;
   };

}());
// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3 foldmethod=marker:
