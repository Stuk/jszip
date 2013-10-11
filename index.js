var PATH = require('path');
var FS = require('fs');
var VM = require('vm');

var context = VM.createContext();
function load(filename) {
    var code = FS.readFileSync(PATH.join(__dirname, filename));
    VM.runInContext(code, context, filename);
}

load('jszip.js');
load('jszip-deflate.js');
load('jszip-inflate.js');
load('jszip-load.js');

module.exports = context.JSZip;
