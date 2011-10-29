/**

JSZip - A Javascript class for generating Zip files
<http://jszip.stuartk.co.uk>

(c) 2011 David Duponchel <d.duponchel@gmail.com>
Licenced under the GPLv3 and the MIT licences

**/
(function () {

   /**
    * Prettify a string read as binary.
    * @param {String} str the string to prettify.
    * @return {String} a pretty string.
    */
   var pretty = function (str)
   {
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
    * @param {String} compressionMethod the method magic to find.
    * @return {String} the JSZip compression object, null if none found.
    */
   var findCompression = function (compressionMethod)
   {
      for (var method in JSZip.compressions)
      {
         if (JSZip.compressions[method].magic === compressionMethod)
         {
            return JSZip.compressions[method];
         }
      }
      return null;
   };

   // StreamReader {{{
   /**
    * @Class StreamReader
    * Read bytes from a stream.
    * @param {String} stream the stream to read.
    */
   function StreamReader(stream) {
      this.stream = stream;
      this.index = 0;
   }
   /**
    * Check that the offset will not go too far.
    * @param {String} offset the additional offset to check.
    * @throws {Error} an Error if the offset is out of bounds.
    */
   StreamReader.prototype.checkRange = function (offset)
   {
      if (this.index + offset > this.stream.length)
      {
         throw new Error("End of stream reached (stream length = " +
                         this.stream.length + ", asked index = " +
                         (this.index + offset) + ")");
      }
   };
   /**
    * Change the index.
    * @param {integer} newIndex The new index.
    * @throws {Error} if the new index is out of the stream.
    */
   StreamReader.prototype.setIndex = function (newIndex)
   {
      if (this.stream.length < newIndex || newIndex < 0)
         {
            throw new Error("Corrupted zip : " +
                            "new index (" + newIndex + ") is out of range " +
                            "(stream length = " + this.stream.length + ")");
         }
         this.index = newIndex;
   };
   /**
    * Check if the end of the file has been reached.
    * @return {boolean} true if it is the case, false otherwise.
    */
   StreamReader.prototype.eof = function ()
   {
      return this.index >= this.stream.length;
   };
   /**
    * Get the byte at the specified index.
    * @param {integer} i the index to use.
    * @return {character} a byte.
    */
   StreamReader.prototype.byteAt = function(i)
   {
      return this.stream.charCodeAt(i) & 0xff;
   };
   /**
    * Get the next byte of this stream.
    * @return {character} the next byte.
    */
   StreamReader.prototype.byte = function ()
   {
      this.checkRange(1);
      return this.byteAt(this.index++ + 1);
   };
   /**
    * Get the next number with a given byte size.
    * @param {integer} size the number of bytes to read.
    * @return {integer} the corresponding number.
    */
   StreamReader.prototype.int = function (size)
   {
      var result = 0, i;
      this.checkRange(size);
      for(i = size - 1; i >= 0; i--)
      {
         result = (result << 8) + this.byteAt(this.index + i);
      }
      this.index += size;
      return result;
   };
   /**
    * Get the next string with a given byte size.
    * @param {integer} size the number of bytes to read.
    * @return {String} the corresponding string.
    */
   StreamReader.prototype.string = function (size)
   {
      var result = "", i, code;
      this.checkRange(size);
      for(i = 0; i < size; i++)
      {
         code = this.byteAt(this.index + i);
         result += String.fromCharCode(code);
      }
      this.index += size;
      return result;
   };
   /**
    * Get the next date.
    * @return {Date} the date.
    */
   StreamReader.prototype.date = function ()
   {
      var dostime = this.int(4);
      return new Date(
         ((dostime >> 25) & 0x7f) + 1980, // year
         ((dostime >> 21) & 0x0f) - 1, // month
         (dostime >> 16) & 0x1f, // day
         (dostime >> 11) & 0x1f, // hour
         (dostime >> 5) & 0x3f, // minute
         (dostime & 0x1f) << 1); // second
   };
   // }}} end of StreamReader

   // ZipEntry {{{
   /**
    * @Class ZipEntry
    * An entry in the zip file.
    */
   function ZipEntry(options)
   {
      this.options = options;
   }
   /**
    * say if the file is encrypted.
    * @return {boolean} true if the file is encrypted, false otherwise.
    */
   ZipEntry.prototype.isEncrypted = function ()
   {
      return (this.bitFlag & 0x0001) === 0x0001;
   };
   /**
    * say if the file has a data decriptor.
    * @return {boolean} true if the file has a data descriptor, false otherwise.
    */
   ZipEntry.prototype.hasDataDescriptor = function ()
   {
      return (this.bitFlag & 0x0008) === 0x0008;
   };
   /**
    * say if the file is a zip64 file.
    * @return {boolean} true if the file is zip64, false otherwise.
    */
   ZipEntry.prototype.isZIP64 = function ()
   {
      return this.options.zip64;
   };
   /**
    * Read the local part header of a zip file and add the info in this object.
    * @param {StreamReader} reader the reader to use.
    */
   ZipEntry.prototype.readLocalPartHeader = function(reader)
   {
      // the signature has already been consumed
      this.versionNeeded     = reader.int(2);
      this.bitFlag           = reader.int(2);
      this.compressionMethod = reader.string(2);
      this.date              = reader.date();
      this.crc32             = reader.int(4);
      this.compressedSize    = reader.int(4);
      this.uncompressedSize  = reader.int(4);
      this.fileNameLength    = reader.int(2);
      this.extraFieldsLength = reader.int(2);

      if (this.isEncrypted())
      {
         throw new Error("Encrypted zip are not supported");
      }
   };
   /**
    * Read the local part of a zip file and add the info in this object.
    * @param {StreamReader} reader the reader to use.
    */
   ZipEntry.prototype.readLocalPart = function(reader)
   {
      var compression;

      this.readLocalPartHeader(reader);

      this.fileName = reader.string(this.fileNameLength);
      this.readExtraFields(reader, this.extraFieldsLength);

      if (!this.hasDataDescriptor())
      {
         // easy : we know the file length
         this.compressedFileData = reader.string(this.compressedSize);
      }
      else
      {
         // hard way : find the data descriptor manually
         this.compressedFileData = this.findDataUntilDataDescriptor(reader);
         this.crc32              = reader.int(4);
         this.compressedSize     = reader.int(this.isZIP64() ? 8 : 4);
         this.uncompressedSize   = reader.int(this.isZIP64() ? 8 : 4);

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
   };

   /**
    * Read data until a data descriptor signature is found.
    * @param {StreamReader} reader the reader to use.
    */
   ZipEntry.prototype.findDataUntilDataDescriptor = function(reader)
   {
      var data = "",
      buffer = reader.string(4),
      byte;

      while(buffer !== JSZip.signature.DATA_DESCRIPTOR)
      {
         byte = reader.string(1);
         data += buffer.slice(0, 1);
         buffer = (buffer + byte).slice(-4);
      }
      return data;
   };
   /**
    * Read the central part of a zip file and add the info in this object.
    * @param {StreamReader} reader the reader to use.
    */
   ZipEntry.prototype.readCentralPart = function(reader)
   {
      this.versionMadeBy = reader.string(2);

      this.readLocalPartHeader(reader);

      this.fileCommentLength      = reader.int(2);
      this.diskNumberStart        = reader.int(2);
      this.internalFileAttributes = reader.int(2);
      this.externalFileAttributes = reader.int(4);
      this.localHeaderOffset      = reader.int(4);

      this.fileName = reader.string(this.fileNameLength);
      this.readExtraFields(reader, this.extraFieldsLength);
      this.fileComment = reader.string(this.fileCommentLength);

      // warning, this is true only for zip with madeBy == DOS (plateform dependent feature)
      this.dir = this.externalFileAttributes & 0x00000010 ? true : false;
   };
   /**
    * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
    * @param {StreamReader} reader the reader to use.
    */
   ZipEntry.prototype.parseZIP64ExtraField = function(reader)
   {
      // should be something, preparing the extra reader
      var extraReader = new StreamReader(this.extraFields[0x0001].value);
      if(this.uncompressedSize === -1)
      {
         this.uncompressedSize = extraReader.int(8);
      }
      if(this.compressedSize === -1)
      {
         this.compressedSize = extraReader.int(8);
      }
      if(this.localHeaderOffset === -1)
      {
         this.localHeaderOffset = extraReader.int(8);
      }
      if(this.diskNumberStart === -1)
      {
         this.diskNumberStart = extraReader.int(4);
      }
   };
   /**
    * Read the central part of a zip file and add the info in this object.
    * @param {StreamReader} reader the reader to use.
    */
   ZipEntry.prototype.readExtraFields = function(reader, extraFieldsLength)
   {
      var start = reader.index,
      extraFieldId,
      extraFieldLength,
      extraFieldValue;

      this.extraFields = this.extraFields || {};

      while (reader.index < start + extraFieldsLength)
      {
         extraFieldId     = reader.int(2);
         extraFieldLength = reader.int(2);
         extraFieldValue  = reader.string(extraFieldLength);

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
   // }}} end of ZipEntry

   // ZipEntries {{{
   /**
    * @Class ZipEntries
    * All the entries in the zip file.
    * @param data the binary stream to load.
    */
   function ZipEntries(data)
   {
      this.files = [];
      if (data) this.load(data);
   }
   /**
    * Check that the reader is on the speficied signature.
    * @param {String} expectedSignature the expected signature.
    * @throws {Error} if it is an other signature.
    */
   ZipEntries.prototype.checkSignature = function(expectedSignature)
   {
      var signature = this.reader.string(4);
      if (signature !== expectedSignature)
      {
         throw new Error("Corrupted zip or bug : unexpected signature " +
                         "(" + pretty(signature) + ", expected " + pretty(expectedSignature) + ")");
      }
   };
   /**
    * Read the end of the central directory.
    */
   ZipEntries.prototype.readBlockEndOfCentral = function ()
   {
      this.diskNumber                  = this.reader.int(2);
      this.diskWithCentralDirStart     = this.reader.int(2);
      this.centralDirRecordsOnThisDisk = this.reader.int(2);
      this.centralDirRecords           = this.reader.int(2);
      this.centralDirSize              = this.reader.int(4);
      this.centralDirOffset            = this.reader.int(4);

      this.zipCommentLength            = this.reader.int(2);
      this.zipComment                  = this.reader.string(this.zipCommentLength);
   };
   /**
    * Read the end of the Zip 64 central directory.
    * Not merged with the method readEndOfCentral :
    * The end of central can coexist with its Zip64 brother,
    * I don't want to read the wrong number of bytes !
    */
   ZipEntries.prototype.readBlockZip64EndOfCentral = function ()
   {
      this.zip64EndOfCentralSize       = this.reader.int(8);
      this.versionMadeBy               = this.reader.string(2);
      this.versionNeeded               = this.reader.int(2);
      this.diskNumber                  = this.reader.int(4);
      this.diskWithCentralDirStart     = this.reader.int(4);
      this.centralDirRecordsOnThisDisk = this.reader.int(8);
      this.centralDirRecords           = this.reader.int(8);
      this.centralDirSize              = this.reader.int(8);
      this.centralDirOffset            = this.reader.int(8);

      this.zip64ExtensibleData = {};
      var extraDataSize = this.zip64EndOfCentralSize - 44,
      index = 0,
      extraFieldId,
      extraFieldLength,
      extraFieldValue;
      while(index < extraDataSize)
         {
            extraFieldId     = this.reader.int(2);
            extraFieldLength = this.reader.int(4);
            extraFieldValue  = this.reader.string(extraFieldLength);
            this.zip64ExtensibleData[extraFieldId] = {
               id: extraFieldId,
               length: extraFieldLength,
               value: extraFieldValue
            };
         }
   };
   /**
    * Read the end of the Zip 64 central directory locator.
    */
   ZipEntries.prototype.readBlockZip64EndOfCentralLocator = function ()
   {
      this.diskWithZip64CentralDirStart = this.reader.int(4);
      this.relativeOffsetEndOfZip64CentralDir = this.reader.int(8);
      this.disksCount = this.reader.int(4);
      if (this.disksCount > 1)
      {
         throw new Error("Multi-volumes zip are not supported");
      }
   };
   /**
    * Read the local files, based on the offset read in the central part.
    */
   ZipEntries.prototype.readLocalFiles = function()
   {
      for(var i = 0; i < this.files.length; i++)
      {
         var file = this.files[i];
         this.reader.setIndex(file.localHeaderOffset);
         this.checkSignature(JSZip.signature.LOCAL_FILE_HEADER);
         file.readLocalPart(this.reader);
      }
   };
   /**
    * Read the central directory.
    */
   ZipEntries.prototype.readCentralDir = function()
   {
      this.reader.setIndex(this.centralDirOffset);
      while(this.reader.string(4) === JSZip.signature.CENTRAL_FILE_HEADER)
      {
         var file = new ZipEntry({
            zip64: this.zip64
         });
         file.readCentralPart(this.reader);
         this.files.push(file);
      }
   };
   /**
    * Read the end of central directory.
    */
   ZipEntries.prototype.readEndOfCentral = function()
   {
      // zip 64 ?
      var offset = this.reader.stream.lastIndexOf(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
      if (offset == -1) // nope
      {
         this.zip64 = false;
         offset = this.reader.stream.lastIndexOf(JSZip.signature.CENTRAL_DIRECTORY_END);
         if (offset == -1)
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
   };
   /**
    * Read a zip file and create ZipEntries.
    * @param {String} data the binary string representing a zip file.
    */
   ZipEntries.prototype.load = function(data)
   {
      var hasMoreFiles = true,
      offset, signature, file, size;

      this.reader = new StreamReader(data);

      this.readEndOfCentral();
      this.readCentralDir();
      this.readLocalFiles();

   };
   // }}} end of ZipEntries

   /**
    * Implementation of the load method of JSZip.
    * It uses the above classes to decode a zip file, and load every files.
    * @param {String} data the data to load.
    * @param {Object} options Options for loading the stream.
    *  options.base64 : is the stream in base64 ? default : false
    */
   JSZip.prototype.load = function(data, options)
   {
      var files, zipEntries, i, input;
      options = options || {};
      if(options.base64)
      {
         data = JSZipBase64.decode(data);
      }

      zipEntries = new ZipEntries(data);
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
   }

})();
// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3 foldmethod=marker:
