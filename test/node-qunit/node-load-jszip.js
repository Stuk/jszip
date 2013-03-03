var fs = require('fs');
var vm = require('vm');

['jszip.js', 'jszip-load.js', 'jszip-deflate.js', 'jszip-inflate.js'].forEach(function (file) {
   vm.runInThisContext(fs.readFileSync(__dirname + '/../../' + file), file);
});

// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3:
