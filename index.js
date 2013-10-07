var
  FS = require('fs'),
  VM = require('vm');

var loadVendor = function(js) {
  VM.runInThisContext( FS.readFileSync('./'+ js), js );
}.bind(this);

loadVendor('jszip.js');
loadVendor('jszip-deflate.js');
loadVendor('jszip-inflate.js');
loadVendor('jszip-load.js');

module.exports = function(data, options) { return new JSZip(data, options); };
