'use strict';

var external = require('../external');
var utils = require('../utils');
var flate = require('../flate');
var GenericWorker = require('../stream/GenericWorker');
var DataWorker = require('../stream/DataWorker');
var StreamHelper = require('../stream/StreamHelper');
var DataLengthProbe = require('../stream/DataLengthProbe');
var Crc32Probe = require('../stream/Crc32Probe');

/**
 * A generator of a gzip file.
 */
function GZipFileWorker() {
    GenericWorker.call(this, "GZipFileWorker");
    this.virgin = true;
}
utils.inherits(GZipFileWorker, GenericWorker);

/**
 * The override of the GeneralWorker#processChunk method.
 * inserts the gzip header before the first chunk.
 * @param {Array} chunk - the chunk of data.
 */
GZipFileWorker.prototype.processChunk = function(chunk) {
    if(this.virgin) {
	this.virgin = false;
	var headerBuffer = new ArrayBuffer(10);
	var headerView = new DataView(headerBuffer);
	headerView.setUint16(0, 0x8b1f, true); // GZip magic
	headerView.setUint8(2, 0x08); // compression algorithm DEFLATE
	headerView.setUint8(3, 0x00); // flags
	// bit 0   FTEXT
	// bit 1   FHCRC
	// bit 2   FEXTRA
	// bit 3   FNAME
	// bit 4   FCOMMENT
	headerView.setUint32(4, (new Date()).getTime()/1000>>>0, true);
	headerView.setUint8(8, 0x00); // no extension headers
	headerView.setUint8(9, 0x03); // OS type UNIX
	this.push({data: new Uint8Array(headerBuffer)});
    }
    this.push(chunk);
};

/**
 * The override of the GeneralWorker#flush method.
 * appends the gzip trailer at the end.
 * WARNING: this assumes that flush is calles only once at the end.
 */
GZipFileWorker.prototype.flush = function() {
    var trailerBuffer = new ArrayBuffer(8);
    var trailerView = new DataView(trailerBuffer);
    trailerView.setUint32(0, this.streamInfo["crc32"]>>>0, true);
    trailerView.setUint32(4, this.streamInfo["originalSize"]>>>0 & 0xffffffff, true);
    this.push({data: new Uint8Array(trailerBuffer)});
};

/**
 * The gzip utility function to gzip compress any data.
 * @param data {Object} - the input data in various format as indicated by their own type of the next param.
 * @param inputFormat {String} - the input format strings "base64", "array", "string", "binaryString", etc.
 * @param outputFormat {String} - what form the output should be in, same values as inputFormat.
 * @param compressionOptions {Object} - options to the DEFLATE compressor, e.g. {level:3} (default)
 * @param onUpdate {String} - callback function normally provided to the StreamHelper#accumulate method.
 * @return {Promise} - as for all the JSZip generators and loaders.
 */
exports.gzip = function(data, inputFormat, outputFormat, compressionOptions, onUpdate) {
    var mimeType = data.contentType || data.mimeType || "";
    if(! (data instanceof GenericWorker)) {
	inputFormat = (inputFormat || "").toLowerCase();
        data = new DataWorker(
	    utils.prepareContent(data.name || "gzip source",
				 data,
				 inputFormat !== "string",
				 inputFormat === "binarystring",
				 inputFormat === "base64"));
    }
    return new StreamHelper(
	data
	    .pipe(new DataLengthProbe("originalSize"))
	    .pipe(new Crc32Probe())
	    .pipe(flate.compressWorker( compressionOptions || {} ))
	    .pipe(new GZipFileWorker()),
	outputFormat.toLowerCase(), mimeType).accumulate(onUpdate);
};
