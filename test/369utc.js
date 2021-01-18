JSZip = require ("../dist/jszip");
fs = require ("fs");

var zip = new JSZip();

zip.file("Hello.txt", "Hello World\n");

zip.generateAsync({type: "nodebuffer",compression: "DEFLATE"}).then(function(content) {
    // see FileSaver.js
    fs.writeFileSync("example.zip",content);
}).catch((e) =>console.log(e) );

