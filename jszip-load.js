/**

JSZip - A Javascript class for generating Zip files
<http://jszip.stuartk.co.uk>

(c) 2011 David Duponchel <d.duponchel@gmail.com>
Licenced under the GPLv3 and the MIT licences

**/
(function () {

  /**
   * Prettify a string read as binary.
   * @param str the string to prettify.
   * @return a pretty string.
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
   * @param compressionMethod the method magic to find.
   * @return the JSZip compression object, null if none found.
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

  /**
   * @Class StreamReader
   * Read bytes from a stream.
   * @param stream the stream to read.
   */
  function StreamReader(stream) {
    this.stream = stream;
    this.index = 0;
  }
  /**
   * Check that the offset will not go too far.
   * @param offset the additional offset to check.
   * @throws an Error if the offset is out of bounds.
   */
  StreamReader.prototype.checkRange = function (offset)
  {
    if (this.index + offset > this.stream.length)
    {
      throw new Error("End of stream reached (stream length = " + this.stream.length + ", asked index = " + (this.index + offset) + ")");
    }
  };
  /**
   * Check if the end of the file has been reached.
   * @return true if it is the case, false otherwise.
   */
  StreamReader.prototype.eof = function ()
  {
    return this.index >= this.stream.length;
  };
  /**
   * Get the byte at the specified index.
   * @param i the index to use.
   * @return a byte.
   */
  StreamReader.prototype.byteAt = function(i)
  {
    return this.stream.charCodeAt(i) & 0xff;
  };
  /**
   * Get the next byte of this stream.
   * @return the next byte.
   */
  StreamReader.prototype.byte = function ()
  {
    this.checkRange(1);
    return this.byteAt(this.index++ + 1);
  };
  /**
   * Get the next number with a given byte size.
   * @param size the number of bytes to read.
   * @return the corresponding number.
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
   * @param size the number of bytes to read.
   * @return the corresponding string.
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
   * @return the date.
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

  /**
   * @Class ZipEntry
   * An entry in the zip file.
   */
  function ZipEntry()
  {
  }
  /**
   * say if the file is encrypted.
   * @return true if the file is encrypted, false otherwise.
   */
  ZipEntry.prototype.isEncrypted = function ()
  {
    return (this.bitFlag & 0x0001) === 0x0001;
  },
  /**
   * say if the file has a data decriptor.
   * @return true if the file has a data descriptor, false otherwise.
   */
  ZipEntry.prototype.hasDataDescriptor = function ()
  {
    return (this.bitFlag & 0x0008) === 0x0008;
  },
  /**
   * Read the local part header of a zip file and add the info in this object.
   * @param reader the reader to use.
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
   * @param reader the reader to use.
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
      this.compressedSize     = reader.int(4);
      this.uncompressedSize   = reader.int(4);

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
   * @param reader the reader to use.
   */
  ZipEntry.prototype.findDataUntilDataDescriptor = function(reader)
  {
    var data = "",
        buffer = reader.string(4),
        byte;

    while(buffer !== "\x50\x4b\x07\x08")
    {
      byte = reader.string(1);
      data += buffer.slice(0, 1);
      buffer = (buffer + byte).slice(-4);
    }
    return data;
  };
  /**
   * Read the central part of a zip file and add the info in this object.
   * @param reader the reader to use.
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
   * Read the central part of a zip file and add the info in this object.
   * @param reader the reader to use.
   */
  ZipEntry.prototype.readExtraFields = function(reader, extraFieldsLength)
  {
    var start = reader.index,
        extraFieldId,
        extraFieldLength,
        extraFieldValue;

    this.extraFields = this.extraFields || [];

    while (reader.index < start + extraFieldsLength)
    {
      extraFieldId = reader.int(2);
      extraFieldLength = reader.int(2);
      extraFieldValue = reader.string(extraFieldLength);

      this.extraFields.push({
        id: extraFieldId,
        length: extraFieldLength,
        value: extraFieldValue
      });
    }
  }


  /**
   * @Class ZipEntries
   * All the entries in the zip file.
   * @param data the binary stream to load.
   */
  function ZipEntries(data)
  {
    this.files = {};
    if (data) this.load(data);
  }
  /**
   * Add a ZipEntry created after a local record.
   * @param zipEntry the zip entry to add.
   * @param offset the number of bytes from the start of this archive.
   */
  ZipEntries.prototype.addLocal = function (zipEntry, offset)
  {
    zipEntry.localHeaderOffset = offset;
    this.files['disk0-offset' + offset] = zipEntry;
  };
  /**
   * Add a ZipEntry created after a central directory record.
   * @param zipEntry the zip entry to add.
   */
  ZipEntries.prototype.addCentral = function(zipEntry)
  {
    var file, i;
    // if we have a central directory recort, the local file header must be already here.
    file = this.files['disk0-offset' + zipEntry.localHeaderOffset];
    if (!file)
    {
      throw new Error("Corrupted zip file : wrong local header offset (" + zipEntry.localHeaderOffset + ")");
    }
    // they contain similiar informations, merging
    for(i in zipEntry)
    {
      file[i] = (typeof file[i] === "undefined" || file[i] === null) ? zipEntry[i] : file[i];
    }
  };
  /**
   * Read the end of the central directory.
   * @param reader the reader to use.
   */
  ZipEntries.prototype.readEndOfCentral = function (reader)
  {
    this.diskNumber                  = reader.int(2);
    this.diskWithCentralDirStart     = reader.int(2);
    this.centralDirRecordsOnThisDisk = reader.int(2);
    this.centralDirRecords           = reader.int(2);
    this.centralDirSize              = reader.int(4);
    this.centralDirOffset            = reader.int(4);
    this.zipCommentLength            = reader.int(2);
    this.zipComment                  = reader.string(this.zipCommentLength);
  };
  /**
   * Read a zip file and create ZipEntries.
   * @param data the binary string representing a zip file.
   */
  ZipEntries.prototype.load = function(data)
  {
    var reader = new StreamReader(data),
        hasMoreFiles = true,
        offset, signature, file, size;
    while(hasMoreFiles)
    {
      offset = reader.index;
      signature = reader.string(4);
      // console.log(pretty(signature));
      switch(signature)
      {
        case JSZip.signature.LOCAL_FILE_HEADER: // local file header signature
          file = new ZipEntry();
          file.readLocalPart(reader);
          this.addLocal(file, offset);
          break;
        case JSZip.signature.CENTRAL_FILE_HEADER: // central file header signature
          file = new ZipEntry();
          file.readCentralPart(reader);
          this.addCentral(file);
          break;
        case JSZip.signature.CENTRAL_DIRECTORY_END: // end of central dir signature
          this.readEndOfCentral(reader);
          break;
        case "\x50\x4b\x06\x08": // archive extra data signature
          throw new Error("Central Directory Encryption Feature not supported");
        case "\x50\x4b\x05\x05": // Digital signature
          // not supported, but don't block the process : discard information
          size = reader.int(2);
          reader.string(size);
          break;
        case "\x50\x4b\x06\x06": // zip64 end of central directory record
        case "\x50\x4b\x06\x07": // zip64 end of central directory locator
          throw new Error("ZIP64 Feature not supported");
        case "\x50\x4b\x07\x08": // data descriptor record
          throw new Error("Data descriptor : unexpected signature");
          break;
        default:
          throw new Error("Corrupted or unsupported zip : " +
                          "signature " + pretty(signature) + " unknown");
      }
      hasMoreFiles = !reader.eof();
    }
  };

  /**
   * Implementation of the load method of JSZip.
   * It uses the above classes to decode a zip file, and load every files.
   * @param data the data to load.
   * @param options Options for loading the stream.
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
